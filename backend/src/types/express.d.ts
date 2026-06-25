import "express";
import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        companyId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};
