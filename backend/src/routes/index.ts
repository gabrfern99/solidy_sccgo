import { Router } from "express";
import authRoutes from "../modules/auth/auth.controller.js";
import contractRoutes from "../modules/contracts/contract.controller.js";
import templateRoutes from "../modules/templates/template.controller.js";
import obraRoutes from "../modules/obras/obra.controller.js";
import poRoutes from "../modules/purchase-orders/po.controller.js";
import uploadRoutes from "../modules/uploads/upload.controller.js";
import dashboardRoutes from "../modules/dashboard/dashboard.controller.js";
import configRoutes from "../modules/config/config.controller.js";
import userRoutes from "../modules/users/user.controller.js";
import publicSignatureRoutes from "../modules/signatures/public-signature.controller.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/contracts", contractRoutes);
router.use("/templates", templateRoutes);
router.use("/obras", obraRoutes);
router.use("/purchase-orders", poRoutes);
router.use("/uploads", uploadRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/config", configRoutes);
router.use("/users", userRoutes);

// Rotas públicas de assinatura (sem auth)
router.use("/signatures", publicSignatureRoutes);

export default router;
