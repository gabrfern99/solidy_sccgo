import { prisma } from "../config/prisma.js";

export async function logAction(params: {
  companyId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata as object | undefined,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log", err);
  }
}
