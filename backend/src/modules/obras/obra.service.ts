import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logAction } from "../../utils/audit.js";
import type {
  CreateObraInput,
  CustoInput,
  StepInput,
  UpdateObraInput,
  VistoriaInput,
} from "./obra.schema.js";

// Roteiro padrão (boas práticas de mercado para gestão de obras)
const DEFAULT_STEPS: { title: string; phase: "PLANEJAMENTO" | "EXECUCAO" | "ENTREGA" }[] =
  [
    { title: "Levantamento e escopo do projeto", phase: "PLANEJAMENTO" },
    { title: "Orçamento e cronograma aprovados", phase: "PLANEJAMENTO" },
    { title: "Vistoria inicial registrada", phase: "PLANEJAMENTO" },
    { title: "Mobilização e canteiro de obras", phase: "EXECUCAO" },
    { title: "Execução estrutural / serviços principais", phase: "EXECUCAO" },
    { title: "Acabamentos e instalações", phase: "EXECUCAO" },
    { title: "Vistoria final e checklist de pendências", phase: "ENTREGA" },
    { title: "Entrega e termo de conclusão", phase: "ENTREGA" },
  ];

function serializeObra(obra: any) {
  const realized =
    obra.custos?.reduce((acc: number, c: any) => acc + Number(c.amount), 0) ?? 0;
  const planned = Number(obra.budgetPlanned ?? 0);
  return {
    ...obra,
    budgetPlanned: planned,
    budgetRealized: realized,
    budgetBalance: planned - realized,
    budgetUsedPct: planned > 0 ? Math.round((realized / planned) * 100) : 0,
    custos: obra.custos?.map((c: any) => ({ ...c, amount: Number(c.amount) })),
  };
}

export async function list(companyId: string) {
  const obras = await prisma.obra.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      custos: true,
      contract: { select: { id: true, title: true } },
      _count: { select: { steps: true, vistorias: true, purchaseOrders: true } },
    },
  });
  return obras.map(serializeObra);
}

export async function getById(companyId: string, id: string) {
  const obra = await prisma.obra.findFirst({
    where: { id, companyId },
    include: {
      steps: { orderBy: { order: "asc" } },
      vistorias: { include: { uploads: true }, orderBy: { createdAt: "desc" } },
      custos: { orderBy: { date: "desc" } },
      purchaseOrders: { include: { payer: true }, orderBy: { createdAt: "desc" } },
      contract: { select: { id: true, title: true, category: true } },
    },
  });
  if (!obra) throw notFound("Obra");
  return serializeObra(obra);
}

export async function create(
  companyId: string,
  userId: string,
  input: CreateObraInput
) {
  if (input.contractId) {
    const contract = await prisma.contract.findFirst({
      where: { id: input.contractId, companyId },
    });
    if (!contract) throw badRequest("Contrato inválido para vínculo");
  }

  const obra = await prisma.obra.create({
    data: {
      companyId,
      name: input.name,
      description: input.description ?? null,
      address: input.address ?? null,
      contractId: input.contractId ?? null,
      budgetPlanned: new Prisma.Decimal(input.budgetPlanned ?? 0),
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      steps: {
        create: DEFAULT_STEPS.map((s, i) => ({
          title: s.title,
          phase: s.phase,
          order: i,
        })),
      },
    },
    include: { steps: true, custos: true },
  });

  await logAction({
    companyId,
    userId,
    action: "OBRA_CREATED",
    entityType: "obra",
    entityId: obra.id,
  });
  return serializeObra(obra);
}

export async function update(
  companyId: string,
  userId: string,
  id: string,
  input: UpdateObraInput
) {
  const existing = await prisma.obra.findFirst({ where: { id, companyId } });
  if (!existing) throw notFound("Obra");

  const data: Prisma.ObraUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.address !== undefined) data.address = input.address;
  if (input.status !== undefined) data.status = input.status;
  if (input.budgetPlanned !== undefined)
    data.budgetPlanned = new Prisma.Decimal(input.budgetPlanned);
  if (input.startDate !== undefined)
    data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined)
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.contractId !== undefined) {
    data.contract = input.contractId
      ? { connect: { id: input.contractId } }
      : { disconnect: true };
  }

  await prisma.obra.update({ where: { id }, data });
  await logAction({
    companyId,
    userId,
    action: "OBRA_UPDATED",
    entityType: "obra",
    entityId: id,
  });
  return getById(companyId, id);
}

export async function remove(companyId: string, userId: string, id: string) {
  const existing = await prisma.obra.findFirst({ where: { id, companyId } });
  if (!existing) throw notFound("Obra");
  await prisma.obra.delete({ where: { id } });
  await logAction({
    companyId,
    userId,
    action: "OBRA_DELETED",
    entityType: "obra",
    entityId: id,
  });
  return { success: true };
}

// ===== Etapas (roteiro) =====
async function ensureObra(companyId: string, obraId: string) {
  const obra = await prisma.obra.findFirst({ where: { id: obraId, companyId } });
  if (!obra) throw notFound("Obra");
  return obra;
}

export async function addStep(companyId: string, obraId: string, input: StepInput) {
  await ensureObra(companyId, obraId);
  return prisma.obraStep.create({
    data: {
      obraId,
      title: input.title,
      phase: input.phase,
      status: input.status,
      order: input.order,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function updateStep(
  companyId: string,
  obraId: string,
  stepId: string,
  input: Partial<StepInput>
) {
  await ensureObra(companyId, obraId);
  const data: Prisma.ObraStepUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.phase !== undefined) data.phase = input.phase;
  if (input.order !== undefined) data.order = input.order;
  if (input.dueDate !== undefined)
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.status !== undefined) {
    data.status = input.status;
    data.completedAt = input.status === "CONCLUIDO" ? new Date() : null;
  }
  return prisma.obraStep.update({ where: { id: stepId }, data });
}

export async function removeStep(companyId: string, obraId: string, stepId: string) {
  await ensureObra(companyId, obraId);
  await prisma.obraStep.delete({ where: { id: stepId } });
  return { success: true };
}

// ===== Vistorias =====
export async function addVistoria(
  companyId: string,
  obraId: string,
  input: VistoriaInput
) {
  await ensureObra(companyId, obraId);
  const vistoria = await prisma.obraVistoria.create({
    data: { obraId, tipo: input.tipo, description: input.description },
  });
  if (input.uploadIds?.length) {
    await prisma.upload.updateMany({
      where: { id: { in: input.uploadIds }, companyId },
      data: { vistoriaId: vistoria.id, entityType: "obra_vistoria", entityId: vistoria.id },
    });
  }
  return prisma.obraVistoria.findUnique({
    where: { id: vistoria.id },
    include: { uploads: true },
  });
}

export async function removeVistoria(
  companyId: string,
  obraId: string,
  vistoriaId: string
) {
  await ensureObra(companyId, obraId);
  await prisma.obraVistoria.delete({ where: { id: vistoriaId } });
  return { success: true };
}

// ===== Custos =====
export async function addCusto(companyId: string, obraId: string, input: CustoInput) {
  await ensureObra(companyId, obraId);
  const custo = await prisma.obraCusto.create({
    data: {
      obraId,
      description: input.description,
      categoria: input.categoria,
      amount: new Prisma.Decimal(input.amount),
      date: input.date ? new Date(input.date) : new Date(),
      isMaintenance: input.isMaintenance,
    },
  });
  return { ...custo, amount: Number(custo.amount) };
}

export async function removeCusto(companyId: string, obraId: string, custoId: string) {
  await ensureObra(companyId, obraId);
  await prisma.obraCusto.delete({ where: { id: custoId } });
  return { success: true };
}
