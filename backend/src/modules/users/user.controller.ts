import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { prisma } from "../../config/prisma.js";
import { badRequest, notFound } from "../../utils/errors.js";

const router = Router();
router.use(authenticate);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "GESTOR", "OPERADOR"]).default("OPERADOR"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "GESTOR", "OPERADOR"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

const publicUser = { id: true, name: true, email: true, role: true, active: true, createdAt: true } as const;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.user.findMany({
        where: { companyId: req.auth!.companyId },
        select: publicUser,
        orderBy: { createdAt: "asc" },
      })
    );
  })
);

router.post(
  "/",
  authorize("ADMIN", "GESTOR"),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.user.findFirst({
      where: { companyId: req.auth!.companyId, email: req.body.email },
    });
    if (exists) throw badRequest("E-mail já cadastrado nesta empresa");
    const user = await prisma.user.create({
      data: {
        companyId: req.auth!.companyId,
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: await bcrypt.hash(req.body.password, 10),
      },
      select: publicUser,
    });
    res.status(201).json(user);
  })
);

router.put(
  "/:id",
  authorize("ADMIN", "GESTOR"),
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!target) throw notFound("Usuário");
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.role !== undefined) data.role = req.body.role;
    if (req.body.active !== undefined) data.active = req.body.active;
    if (req.body.password) data.password = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: publicUser,
    });
    res.json(user);
  })
);

export default router;
