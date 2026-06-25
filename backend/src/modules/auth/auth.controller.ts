import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import * as service from "./auth.service.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await service.register(req.body);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body);
    res.json(result);
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await service.me(req.auth!.userId);
    res.json(result);
  })
);

export default router;
