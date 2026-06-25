import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { badRequest, unauthorized } from "../../utils/errors.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

function signToken(payload: {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}) {
  const options = { expiresIn: env.jwtExpiresIn } as jwt.SignOptions;
  return jwt.sign(payload, env.jwtSecret, options);
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.company.findUnique({
    where: { cnpj: input.cnpj },
  });
  if (existing) throw badRequest("Já existe uma empresa com este CNPJ");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const company = await prisma.company.create({
    data: {
      name: input.companyName,
      cnpj: input.cnpj,
      email: input.email,
      users: {
        create: {
          name: input.name,
          email: input.email,
          password: passwordHash,
          role: "ADMIN",
        },
      },
      payerCompanies: {
        create: { name: input.companyName, cnpj: input.cnpj },
      },
    },
    include: { users: true },
  });

  const user = company.users[0]!;
  const token = signToken({
    userId: user.id,
    companyId: company.id,
    role: user.role,
    email: user.email,
  });

  return { token, user: publicUser(user), company: { id: company.id, name: company.name } };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, active: true },
    include: { company: true },
  });
  if (!user) throw unauthorized("Credenciais inválidas");

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw unauthorized("Credenciais inválidas");

  const token = signToken({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: publicUser(user),
    company: { id: user.company.id, name: user.company.name },
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  if (!user) throw unauthorized();
  return {
    user: publicUser(user),
    company: { id: user.company.id, name: user.company.name, cnpj: user.company.cnpj },
  };
}
