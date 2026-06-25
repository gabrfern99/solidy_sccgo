import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/auth.js";
import * as service from "./dashboard.service.js";

const router = Router();
router.use(authenticate);

router.get("/metrics", asyncHandler(async (req, res) => {
  res.json(await service.metrics(req.auth!.companyId));
}));

router.get("/alerts", asyncHandler(async (req, res) => {
  res.json(await service.alerts(req.auth!.companyId));
}));

router.get("/reports", asyncHandler(async (req, res) => {
  res.json(await service.reports(req.auth!.companyId));
}));

router.get("/reports/pdf", asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="relatorio-obras.pdf"`);
  await service.reportsPdf(req.auth!.companyId, res);
}));

export default router;
