import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import * as service from "./notification.service.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await service.list(req.auth!.companyId));
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    res.json(await service.markAllRead(req.auth!.companyId));
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    res.json(await service.markRead(req.auth!.companyId, req.params.id));
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await service.clear(req.auth!.companyId));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.remove(req.auth!.companyId, req.params.id));
  })
);

export default router;
