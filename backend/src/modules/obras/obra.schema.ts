import { z } from "zod";

export const createObraSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
  budgetPlanned: z.number().nonnegative().default(0),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateObraSchema = createObraSchema.partial().extend({
  status: z.enum(["PLANEJAMENTO", "EM_EXECUCAO", "CONCLUIDA", "PARALISADA"]).optional(),
});

export const stepSchema = z.object({
  title: z.string().min(1),
  phase: z.enum(["PLANEJAMENTO", "EXECUCAO", "ENTREGA"]).default("PLANEJAMENTO"),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"]).default("PENDENTE"),
  order: z.number().int().default(0),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateStepSchema = stepSchema.partial();

export const vistoriaSchema = z.object({
  tipo: z.enum(["INICIAL", "FINAL"]),
  description: z.string().min(1),
  uploadIds: z.array(z.string().uuid()).optional().default([]),
});

export const custoSchema = z.object({
  description: z.string().min(1),
  categoria: z
    .enum([
      "MATERIAL",
      "MAO_DE_OBRA",
      "EQUIPAMENTO",
      "SERVICO_TERCEIRO",
      "MANUTENCAO",
      "OUTRO",
    ])
    .default("OUTRO"),
  amount: z.number().nonnegative(),
  date: z.string().datetime().optional().nullable(),
  isMaintenance: z.boolean().default(false),
});

export type CreateObraInput = z.infer<typeof createObraSchema>;
export type UpdateObraInput = z.infer<typeof updateObraSchema>;
export type StepInput = z.infer<typeof stepSchema>;
export type VistoriaInput = z.infer<typeof vistoriaSchema>;
export type CustoInput = z.infer<typeof custoSchema>;
