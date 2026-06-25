import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createObraSchema,
  custoSchema,
  stepSchema,
  updateObraSchema,
  updateStepSchema,
  vistoriaSchema,
} from "./obra.schema.js";
import * as service from "./obra.service.js";

const router = Router();
router.use(authenticate);

const cid = (req: any) => req.auth!.companyId as string;
const uid = (req: any) => req.auth!.userId as string;

router.get("/", asyncHandler(async (req, res) => {
  res.json(await service.list(cid(req)));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json(await service.getById(cid(req), req.params.id));
}));

router.post("/", validate(createObraSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(cid(req), uid(req), req.body));
}));

router.put("/:id", validate(updateObraSchema), asyncHandler(async (req, res) => {
  res.json(await service.update(cid(req), uid(req), req.params.id, req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  res.json(await service.remove(cid(req), uid(req), req.params.id));
}));

// ===== Etapas =====
router.post("/:id/steps", validate(stepSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await service.addStep(cid(req), req.params.id, req.body));
}));

router.put("/:id/steps/:stepId", validate(updateStepSchema), asyncHandler(async (req, res) => {
  res.json(await service.updateStep(cid(req), req.params.id, req.params.stepId, req.body));
}));

router.delete("/:id/steps/:stepId", asyncHandler(async (req, res) => {
  res.json(await service.removeStep(cid(req), req.params.id, req.params.stepId));
}));

// ===== Vistorias =====
router.post("/:id/vistorias", validate(vistoriaSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await service.addVistoria(cid(req), req.params.id, req.body));
}));

router.delete("/:id/vistorias/:vistoriaId", asyncHandler(async (req, res) => {
  res.json(await service.removeVistoria(cid(req), req.params.id, req.params.vistoriaId));
}));

// ===== Custos =====
router.post("/:id/custos", validate(custoSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await service.addCusto(cid(req), req.params.id, req.body));
}));

router.delete("/:id/custos/:custoId", asyncHandler(async (req, res) => {
  res.json(await service.removeCusto(cid(req), req.params.id, req.params.custoId));
}));

export default router;
