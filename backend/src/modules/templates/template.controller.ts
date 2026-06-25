import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createTemplateSchema, updateTemplateSchema } from "./template.schema.js";
import * as service from "./template.service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await service.list(req.auth!.companyId));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.getById(req.auth!.companyId, req.params.id));
  })
);

router.post(
  "/",
  validate(createTemplateSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await service.create(req.auth!.companyId, req.auth!.userId, req.body)
    );
  })
);

router.put(
  "/:id",
  validate(updateTemplateSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await service.update(req.auth!.companyId, req.auth!.userId, req.params.id, req.body)
    );
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.remove(req.auth!.companyId, req.auth!.userId, req.params.id));
  })
);

export default router;
