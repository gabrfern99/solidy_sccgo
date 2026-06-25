import { z } from "zod";

const categoryEnum = z.enum(["SERVICO", "TRABALHO", "OBRA", "LOCACAO", "OUTRO"]);

export const createContractSchema = z.object({
  title: z.string().min(2),
  templateId: z.string().uuid().optional().nullable(),
  category: categoryEnum.default("SERVICO"),
  counterparty: z.string().min(2),
  counterpartyDoc: z.string().optional().nullable(),
  value: z.number().nonnegative().default(0),
  isMonthly: z.boolean().default(false),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  fieldValues: z.record(z.any()).optional().nullable(),
  body: z.string().optional().nullable(),
});

export const updateContractSchema = createContractSchema.partial();

export const sendSignatureSchema = z.object({
  channel: z.enum(["EMAIL", "WHATSAPP", "AMBOS"]),
  signerName: z.string().min(2),
  signerEmail: z.string().email().optional().nullable(),
  signerPhone: z.string().optional().nullable(),
  expiresInDays: z.number().int().positive().max(365).default(7),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type SendSignatureInput = z.infer<typeof sendSignatureSchema>;
