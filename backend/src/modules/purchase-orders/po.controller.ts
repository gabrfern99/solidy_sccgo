import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createPOSchema, updatePOSchema } from "./po.schema.js";
import * as service from "./po.service.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  res.json(await service.list(req.auth!.companyId, req.query.obraId as string | undefined));
}));

router.post("/", validate(createPOSchema), asyncHandler(async (req, res) => {
  res.status(201).json(
    await service.create(req.auth!.companyId, req.auth!.userId, req.body)
  );
}));

router.patch("/:id/status", validate(updatePOSchema), asyncHandler(async (req, res) => {
  res.json(
    await service.updateStatus(req.auth!.companyId, req.auth!.userId, req.params.id, req.body)
  );
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  res.json(await service.remove(req.auth!.companyId, req.auth!.userId, req.params.id));
}));

export default router;
