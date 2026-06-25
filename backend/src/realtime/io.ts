import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

let io: Server | null = null;

interface SocketJwt {
  userId: string;
  companyId: string;
}

// Inicializa o servidor WebSocket e autentica cada conexão via JWT.
// Cada cliente entra na sala da própria empresa (isolamento multi-tenant).
export function initRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = jwt.verify(token, env.jwtSecret) as SocketJwt;
      socket.data.companyId = payload.companyId;
      socket.join(`company:${payload.companyId}`);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  return io;
}

// Emite um evento para todos os clientes conectados de uma empresa.
export function emitToCompany(companyId: string, event: string, payload: unknown) {
  io?.to(`company:${companyId}`).emit(event, payload);
}
