import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logAction } from "../../utils/audit.js";
import type { CreatePOInput, UpdatePOInput } from "./po.schema.js";

function serialize(po: any) {
  return { ...po, amount: Number(po.amount) };
}

async function nextNumber(companyId: string) {
  const count = await prisma.purchaseOrder.count({ where: { companyId } });
  const year = new Date().getFullYear();
  return `OC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function list(companyId: string, obraId?: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: { companyId, ...(obraId ? { obraId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      payer: true,
      obra: { select: { id: true, name: true } },
    },
  });
  return pos.map(serialize);
}

export async function create(
  companyId: string,
  userId: string,
  input: CreatePOInput
) {
  const obra = await prisma.obra.findFirst({
    where: { id: input.obraId, companyId },
  });
  if (!obra) throw badRequest("Obra inválida");

  const payer = await prisma.payerCompany.findFirst({
    where: { id: input.payerId, companyId },
  });
  if (!payer) throw badRequest("CNPJ pagador inválido");

  const po = await prisma.purchaseOrder.create({
    data: {
      companyId,
      obraId: input.obraId,
      payerId: input.payerId,
      supplier: input.supplier,
      description: input.description ?? null,
      amount: new Prisma.Decimal(input.amount),
      number: await nextNumber(companyId),
    },
    include: { payer: true, obra: { select: { id: true, name: true } } },
  });

  await logAction({
    companyId,
    userId,
    action: "PURCHASE_ORDER_CREATED",
    entityType: "purchase_order",
    entityId: po.id,
    metadata: { number: po.number, payerCnpj: payer.cnpj },
  });
  return serialize(po);
}

export async function updateStatus(
  companyId: string,
  userId: string,
  id: string,
  input: UpdatePOInput
) {
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw notFound("Ordem de compra");
  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: input.status },
    include: { payer: true, obra: { select: { id: true, name: true } } },
  });
  await logAction({
    companyId,
    userId,
    action: "PURCHASE_ORDER_STATUS",
    entityType: "purchase_order",
    entityId: id,
    metadata: { status: input.status },
  });
  return serialize(po);
}

export async function remove(companyId: string, userId: string, id: string) {
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw notFound("Ordem de compra");
  await prisma.purchaseOrder.delete({ where: { id } });
  await logAction({
    companyId,
    userId,
    action: "PURCHASE_ORDER_DELETED",
    entityType: "purchase_order",
    entityId: id,
  });
  return { success: true };
}
