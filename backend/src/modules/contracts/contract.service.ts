import { randomUUID } from "node:crypto";
import { ContractStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logAction } from "../../utils/audit.js";
import { computeVigencia, deriveStatus } from "../../utils/vigencia.js";
import type {
  CreateContractInput,
  SendSignatureInput,
  UpdateContractInput,
} from "./contract.schema.js";

interface ListFilters {
  search?: string;
  status?: string;
  category?: string;
}

function serialize(contract: any) {
  const vigencia = computeVigencia(contract.endDate ?? null);
  const effectiveStatus = deriveStatus(contract.status, contract.endDate ?? null);
  return {
    ...contract,
    value: contract.value ? Number(contract.value) : 0,
    status: effectiveStatus,
    vigencia,
  };
}

// Substitui marcadores {{campo}} do corpo pelos valores preenchidos no contrato.
// Mantém o marcador original quando não houver valor correspondente.
function renderBody(
  body: string | null | undefined,
  fieldValues: any,
  contract?: { counterparty?: string | null; value?: any }
): string | null {
  if (!body) return body ?? null;
  const values: Record<string, unknown> = { ...(fieldValues ?? {}) };
  if (contract) {
    if (values.counterparty === undefined) values.counterparty = contract.counterparty ?? undefined;
    if (values.valor === undefined && contract.value != null) values.valor = Number(contract.value);
  }
  return body.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key: string) => {
    const v = values[key];
    return v !== undefined && v !== null && v !== "" ? String(v) : match;
  });
}

export async function list(companyId: string, filters: ListFilters) {
  const where: Prisma.ContractWhereInput = { companyId };

  if (filters.status) where.status = filters.status as ContractStatus;
  if (filters.category) where.category = filters.category as any;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { counterparty: { contains: filters.search, mode: "insensitive" } },
      { counterpartyDoc: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { template: { select: { name: true } } },
  });
  return contracts.map(serialize);
}

export async function getById(companyId: string, id: string) {
  const contract = await prisma.contract.findFirst({
    where: { id, companyId },
    include: {
      template: { include: { fields: { orderBy: { order: "asc" } } } },
      signatureRequests: { orderBy: { sentAt: "desc" } },
      obras: { select: { id: true, name: true, status: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!contract) throw notFound("Contrato");
  const rendered = {
    ...contract,
    body: renderBody(contract.body, contract.fieldValues, contract),
  };
  return serialize(rendered);
}

export async function create(
  companyId: string,
  userId: string,
  input: CreateContractInput
) {
  if (input.templateId) {
    const tpl = await prisma.contractTemplate.findFirst({
      where: { id: input.templateId, companyId },
    });
    if (!tpl) throw badRequest("Template inválido");
  }

  const contract = await prisma.contract.create({
    data: {
      companyId,
      createdById: userId,
      templateId: input.templateId ?? null,
      title: input.title,
      category: input.category,
      counterparty: input.counterparty,
      counterpartyDoc: input.counterpartyDoc ?? null,
      value: new Prisma.Decimal(input.value ?? 0),
      isMonthly: input.isMonthly ?? false,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      fieldValues: input.fieldValues ?? undefined,
      body: input.body ?? null,
      status: ContractStatus.RASCUNHO,
    },
  });

  await logAction({
    companyId,
    userId,
    action: "CONTRACT_CREATED",
    entityType: "contract",
    entityId: contract.id,
  });

  return serialize(contract);
}

export async function update(
  companyId: string,
  userId: string,
  id: string,
  input: UpdateContractInput
) {
  const existing = await prisma.contract.findFirst({ where: { id, companyId } });
  if (!existing) throw notFound("Contrato");

  const data: Prisma.ContractUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.category !== undefined) data.category = input.category;
  if (input.counterparty !== undefined) data.counterparty = input.counterparty;
  if (input.counterpartyDoc !== undefined) data.counterpartyDoc = input.counterpartyDoc;
  if (input.value !== undefined) data.value = new Prisma.Decimal(input.value);
  if (input.isMonthly !== undefined) data.isMonthly = input.isMonthly;
  if (input.startDate !== undefined)
    data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined)
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.fieldValues !== undefined) data.fieldValues = input.fieldValues ?? undefined;
  if (input.body !== undefined) data.body = input.body;

  const contract = await prisma.contract.update({ where: { id }, data });

  await logAction({
    companyId,
    userId,
    action: "CONTRACT_UPDATED",
    entityType: "contract",
    entityId: id,
  });

  return serialize(contract);
}

export async function remove(companyId: string, userId: string, id: string) {
  const existing = await prisma.contract.findFirst({ where: { id, companyId } });
  if (!existing) throw notFound("Contrato");
  await prisma.contract.delete({ where: { id } });
  await logAction({
    companyId,
    userId,
    action: "CONTRACT_DELETED",
    entityType: "contract",
    entityId: id,
  });
  return { success: true };
}

// ===== Assinatura eletrônica =====
export async function sendForSignature(
  companyId: string,
  userId: string,
  contractId: string,
  input: SendSignatureInput
) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId },
  });
  if (!contract) throw notFound("Contrato");
  if (contract.status === ContractStatus.ASSINADO)
    throw badRequest("Contrato já assinado");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

  const channels =
    input.channel === "AMBOS" ? (["EMAIL", "WHATSAPP"] as const) : [input.channel];

  const created = [];
  for (const channel of channels) {
    const token = randomUUID();
    const req = await prisma.signatureRequest.create({
      data: {
        contractId,
        channel: input.channel, // registra o canal solicitado (inclui AMBOS)
        signerName: input.signerName,
        signerEmail: input.signerEmail ?? null,
        signerPhone: input.signerPhone ?? null,
        token,
        expiresAt,
      },
    });
    // Simulação de disparo local (e-mail / WhatsApp): registramos o link gerado.
    const link = `${env.appPublicUrl}/assinar/${token}`;
    console.log(`[signature][${channel}] link gerado para ${input.signerName}: ${link}`);
    created.push({ ...req, link, dispatchChannel: channel });
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: ContractStatus.AGUARDANDO_ASSINATURA },
  });

  await logAction({
    companyId,
    userId,
    action: "SIGNATURE_SENT",
    entityType: "contract",
    entityId: contractId,
    metadata: { channel: input.channel },
  });

  return created;
}

// Endpoint público: assinar via token
export async function signByToken(token: string) {
  const request = await prisma.signatureRequest.findUnique({
    where: { token },
    include: { contract: true },
  });
  if (!request) throw notFound("Solicitação de assinatura");
  if (request.status === "ASSINADO")
    return { alreadySigned: true, contractTitle: request.contract.title };

  if (request.expiresAt && request.expiresAt < new Date()) {
    await prisma.signatureRequest.update({
      where: { token },
      data: { status: "EXPIRADO", attempts: { increment: 1 } },
    });
    throw badRequest("Link de assinatura expirado");
  }

  const now = new Date();
  await prisma.signatureRequest.update({
    where: { token },
    data: { status: "ASSINADO", signedAt: now, attempts: { increment: 1 } },
  });

  // Notificação automática ao sistema + arquivamento em contratos vigentes
  await prisma.contract.update({
    where: { id: request.contractId },
    data: { status: ContractStatus.ATIVO, signedAt: now },
  });

  await logAction({
    companyId: request.contract.companyId,
    action: "CONTRACT_SIGNED",
    entityType: "contract",
    entityId: request.contractId,
    metadata: { signer: request.signerName, channel: request.channel },
  });

  return {
    success: true,
    contractTitle: request.contract.title,
    signedAt: now,
  };
}

export async function getSignatureInfo(token: string) {
  const request = await prisma.signatureRequest.findUnique({
    where: { token },
    include: {
      contract: {
        select: {
          title: true,
          body: true,
          counterparty: true,
          value: true,
          fieldValues: true,
        },
      },
    },
  });
  if (!request) throw notFound("Solicitação de assinatura");
  const { value, fieldValues, ...contractRest } = request.contract;
  return {
    signerName: request.signerName,
    status: request.status,
    expiresAt: request.expiresAt,
    contract: {
      ...contractRest,
      body: renderBody(request.contract.body, fieldValues, request.contract),
    },
  };
}

// Fila de assinaturas pendentes (multi-tenant)
export async function pendingSignatures(companyId: string) {
  const requests = await prisma.signatureRequest.findMany({
    where: { contract: { companyId }, status: "AGUARDANDO" },
    orderBy: { sentAt: "desc" },
    include: { contract: { select: { id: true, title: true, counterparty: true } } },
  });
  return requests;
}

// Renovar / Encerrar / Aditivo (ações rápidas)
export async function renew(companyId: string, userId: string, id: string, months: number) {
  const contract = await prisma.contract.findFirst({ where: { id, companyId } });
  if (!contract) throw notFound("Contrato");
  const base = contract.endDate ?? new Date();
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + months);
  const updated = await prisma.contract.update({
    where: { id },
    data: { endDate: newEnd, status: ContractStatus.ATIVO },
  });
  await logAction({
    companyId,
    userId,
    action: "CONTRACT_RENEWED",
    entityType: "contract",
    entityId: id,
    metadata: { months },
  });
  return serialize(updated);
}

export async function close(companyId: string, userId: string, id: string) {
  const contract = await prisma.contract.findFirst({ where: { id, companyId } });
  if (!contract) throw notFound("Contrato");
  const updated = await prisma.contract.update({
    where: { id },
    data: { status: ContractStatus.ENCERRADO, endDate: new Date() },
  });
  await logAction({
    companyId,
    userId,
    action: "CONTRACT_CLOSED",
    entityType: "contract",
    entityId: id,
  });
  return serialize(updated);
}
