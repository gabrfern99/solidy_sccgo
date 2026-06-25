import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createContractSchema,
  sendSignatureSchema,
  updateContractSchema,
} from "./contract.schema.js";
import * as service from "./contract.service.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, status, category } = req.query;
    const result = await service.list(req.auth!.companyId, {
      search: search as string,
      status: status as string,
      category: category as string,
    });
    res.json(result);
  })
);

router.get(
  "/signatures/pending",
  asyncHandler(async (req, res) => {
    res.json(await service.pendingSignatures(req.auth!.companyId));
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
  validate(createContractSchema),
  asyncHandler(async (req, res) => {
    const result = await service.create(
      req.auth!.companyId,
      req.auth!.userId,
      req.body
    );
    res.status(201).json(result);
  })
);

router.put(
  "/:id",
  validate(updateContractSchema),
  asyncHandler(async (req, res) => {
    const result = await service.update(
      req.auth!.companyId,
      req.auth!.userId,
      req.params.id,
      req.body
    );
    res.json(result);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.remove(req.auth!.companyId, req.auth!.userId, req.params.id));
  })
);

router.post(
  "/:id/send-signature",
  validate(sendSignatureSchema),
  asyncHandler(async (req, res) => {
    const result = await service.sendForSignature(
      req.auth!.companyId,
      req.auth!.userId,
      req.params.id,
      req.body
    );
    res.status(201).json(result);
  })
);

router.post(
  "/:id/renew",
  asyncHandler(async (req, res) => {
    const months = Number(req.body?.months ?? 12);
    res.json(
      await service.renew(req.auth!.companyId, req.auth!.userId, req.params.id, months)
    );
  })
);

router.post(
  "/:id/close",
  asyncHandler(async (req, res) => {
    res.json(await service.close(req.auth!.companyId, req.auth!.userId, req.params.id));
  })
);

export default router;
