import { z } from "zod";

export const createPOSchema = z.object({
  obraId: z.string().uuid(),
  payerId: z.string().uuid(),
  supplier: z.string().min(2),
  description: z.string().optional().nullable(),
  amount: z.number().nonnegative(),
});

export const updatePOSchema = z.object({
  status: z.enum(["ABERTA", "APROVADA", "RECEBIDA", "CANCELADA"]),
});

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type UpdatePOInput = z.infer<typeof updatePOSchema>;
