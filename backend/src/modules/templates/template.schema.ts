import { z } from "zod";

const fieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z
    .enum([
      "text",
      "textarea",
      "number",
      "date",
      "time",
      "currency",
      "address",
      "party",
      "signature",
    ])
    .default("text"),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["SERVICO", "TRABALHO", "OBRA", "LOCACAO", "OUTRO"]).default("SERVICO"),
  description: z.string().optional().nullable(),
  body: z.string().default(""),
  fields: z.array(fieldSchema).default([]),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
