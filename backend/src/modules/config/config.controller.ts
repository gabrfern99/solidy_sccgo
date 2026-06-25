import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { prisma } from "../../config/prisma.js";
import { notFound } from "../../utils/errors.js";

const router = Router();
router.use(authenticate);

const payerSchema = z.object({
  name: z.string().min(2),
  cnpj: z.string().min(11),
});

// ===== Dados da empresa / parametrização =====
router.get(
  "/company",
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.auth!.companyId },
      select: { id: true, name: true, cnpj: true, email: true, phone: true },
    });
    if (!company) throw notFound("Empresa");
    res.json(company);
  })
);

router.put(
  "/company",
  authorize("ADMIN", "GESTOR"),
  validate(z.object({ name: z.string().min(2).optional(), email: z.string().email().optional().nullable(), phone: z.string().optional().nullable() })),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.update({
      where: { id: req.auth!.companyId },
      data: req.body,
      select: { id: true, name: true, cnpj: true, email: true, phone: true },
    });
    res.json(company);
  })
);

// ===== CNPJs pagadores (usados na geração de O.C.) =====
router.get(
  "/payers",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.payerCompany.findMany({
        where: { companyId: req.auth!.companyId },
        orderBy: { name: "asc" },
      })
    );
  })
);

router.post(
  "/payers",
  authorize("ADMIN", "GESTOR"),
  validate(payerSchema),
  asyncHandler(async (req, res) => {
    const payer = await prisma.payerCompany.create({
      data: { ...req.body, companyId: req.auth!.companyId },
    });
    res.status(201).json(payer);
  })
);

router.delete(
  "/payers/:id",
  authorize("ADMIN", "GESTOR"),
  asyncHandler(async (req, res) => {
    await prisma.payerCompany.deleteMany({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    res.json({ success: true });
  })
);

// ===== Audit logs (rastreabilidade) =====
router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.auditLog.findMany({
        where: { companyId: req.auth!.companyId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true } } },
      })
    );
  })
);

export default router;
