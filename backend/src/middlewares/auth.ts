import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserRole } from "@prisma/client";
import { forbidden, unauthorized } from "../utils/errors.js";

interface JwtPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Token ausente");
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.auth = payload;
    next();
  } catch {
    throw unauthorized("Token inválido ou expirado");
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw unauthorized();
    if (roles.length && !roles.includes(req.auth.role)) {
      throw forbidden("Você não tem permissão para esta ação");
    }
    next();
  };
}
