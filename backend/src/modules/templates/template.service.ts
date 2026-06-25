import { prisma } from "../../config/prisma.js";
import { notFound } from "../../utils/errors.js";
import { logAction } from "../../utils/audit.js";
import type { CreateTemplateInput, UpdateTemplateInput } from "./template.schema.js";

export async function list(companyId: string) {
  return prisma.contractTemplate.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: {
      fields: { orderBy: { order: "asc" } },
      _count: { select: { contracts: true } },
    },
  });
}

export async function getById(companyId: string, id: string) {
  const tpl = await prisma.contractTemplate.findFirst({
    where: { id, companyId },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!tpl) throw notFound("Template");
  return tpl;
}

export async function create(
  companyId: string,
  userId: string,
  input: CreateTemplateInput
) {
  const tpl = await prisma.contractTemplate.create({
    data: {
      companyId,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      body: input.body ?? "",
      fields: {
        create: input.fields.map((f, i) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          order: f.order ?? i,
        })),
      },
    },
    include: { fields: true },
  });
  await logAction({
    companyId,
    userId,
    action: "TEMPLATE_CREATED",
    entityType: "contract_template",
    entityId: tpl.id,
  });
  return tpl;
}

export async function update(
  companyId: string,
  userId: string,
  id: string,
  input: UpdateTemplateInput
) {
  const existing = await prisma.contractTemplate.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw notFound("Template");

  const tpl = await prisma.$transaction(async (tx) => {
    await tx.contractTemplate.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        category: input.category ?? existing.category,
        description: input.description ?? existing.description,
        body: input.body ?? existing.body,
      },
    });
    if (input.fields) {
      await tx.contractTemplateField.deleteMany({ where: { templateId: id } });
      await tx.contractTemplateField.createMany({
        data: input.fields.map((f, i) => ({
          templateId: id,
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          order: f.order ?? i,
        })),
      });
    }
    return tx.contractTemplate.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  });

  await logAction({
    companyId,
    userId,
    action: "TEMPLATE_UPDATED",
    entityType: "contract_template",
    entityId: id,
  });
  return tpl;
}

export async function remove(companyId: string, userId: string, id: string) {
  const existing = await prisma.contractTemplate.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw notFound("Template");
  await prisma.contractTemplate.delete({ where: { id } });
  await logAction({
    companyId,
    userId,
    action: "TEMPLATE_DELETED",
    entityType: "contract_template",
    entityId: id,
  });
  return { success: true };
}
