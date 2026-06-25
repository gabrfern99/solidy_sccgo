import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logAction } from "../../utils/audit.js";
import { createPdfDoc, setHeader, field, finish, brl, fmtDate } from "../../utils/pdf.js";
import type { Writable } from "node:stream";
import type { CreatePOInput, UpdatePOInput } from "./po.schema.js";

function serialize(po: any) {
  return { ...po, amount: Number(po.amount) };
}

async function nextNumber(companyId: string) {
  const count = await prisma.purchaseOrder.count({ where: { companyId } });
  const year = new Date().getFullYear();
  return `OC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function getById(companyId: string, id: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: {
      payer: true,
      obra: { select: { id: true, name: true, address: true } },
      company: { select: { name: true, cnpj: true } },
    },
  });
  if (!po) throw notFound("Ordem de compra");
  return serialize(po);
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

const PO_STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  APROVADA: "Aprovada",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
};

export async function generatePdf(companyId: string, id: string, res: Writable) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: {
      payer: true,
      obra: { select: { id: true, name: true, address: true } },
      company: { select: { name: true, cnpj: true } },
    },
  });
  if (!po) throw notFound("Ordem de compra");

  const doc = createPdfDoc(res, `OC-${po.number}`);
  setHeader(doc, "ORDEM DE COMPRA", po.number);

  field(doc, "Empresa", po.company?.name ?? "-");
  field(doc, "CNPJ", po.company?.cnpj ?? "-");
  doc.moveDown(0.5);
  field(doc, "Obra", po.obra?.name ?? "-");
  if (po.obra?.address) field(doc, "Endereço da obra", po.obra.address);
  doc.moveDown(0.5);
  field(doc, "Fornecedor", po.supplier);
  field(doc, "CNPJ Pagador", `${po.payer?.name ?? "-"} — ${po.payer?.cnpj ?? "-"}`);
  if (po.description) field(doc, "Descrição", po.description);
  field(doc, "Valor", brl(Number(po.amount)));
  field(doc, "Status", PO_STATUS_LABELS[po.status] ?? po.status);
  field(doc, "Data de emissão", fmtDate(po.createdAt));

  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
  doc.moveDown(1);
  doc.fontSize(9).font("Helvetica").fillColor("#94a3b8").text(
    "Documento gerado eletronicamente pelo sistema de Controle de Contratos & Gestão Orçamentária.",
    { align: "center" }
  );

  finish(doc);
}
