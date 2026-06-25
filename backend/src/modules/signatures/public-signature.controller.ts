import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "../contracts/contract.service.js";

// Rotas públicas (sem autenticação) usadas pelo link de assinatura
const router = Router();

router.get(
  "/:token",
  asyncHandler(async (req, res) => {
    res.json(await service.getSignatureInfo(req.params.token));
  })
);

router.post(
  "/:token/sign",
  asyncHandler(async (req, res) => {
    res.json(await service.signByToken(req.params.token));
  })
);

export default router;
