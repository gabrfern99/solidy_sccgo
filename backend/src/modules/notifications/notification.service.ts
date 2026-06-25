import { prisma } from "../../config/prisma.js";
import { emitToCompany } from "../../realtime/io.js";
import { notFound } from "../../utils/errors.js";

interface CreateNotificationInput {
  type?: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
}

// Cria a notificação de forma persistente e sinaliza os clientes via WebSocket.
export async function create(companyId: string, input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      companyId,
      type: input.type ?? "INFO",
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      userId: input.userId ?? null,
    },
  });
  emitToCompany(companyId, "notification:new", notification);
  return notification;
}

export async function list(companyId: string) {
  return prisma.notification.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function ensureOwned(companyId: string, id: string) {
  const found = await prisma.notification.findFirst({ where: { id, companyId } });
  if (!found) throw notFound("Notificação");
  return found;
}

export async function markRead(companyId: string, id: string) {
  await ensureOwned(companyId, id);
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllRead(companyId: string) {
  await prisma.notification.updateMany({
    where: { companyId, read: false },
    data: { read: true },
  });
  return { success: true };
}

export async function remove(companyId: string, id: string) {
  await ensureOwned(companyId, id);
  await prisma.notification.delete({ where: { id } });
  return { success: true };
}

export async function clear(companyId: string) {
  await prisma.notification.deleteMany({ where: { companyId } });
  return { success: true };
}
