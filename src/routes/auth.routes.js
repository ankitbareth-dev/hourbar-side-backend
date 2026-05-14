import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.get("/", authController.showLogin);
router.post("/", authController.handleLogin);
router.get("/logout", authController.handleLogout);

export default router;
