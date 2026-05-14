import { Router } from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard", isAuthenticated, dashboardController.showDashboard);
router.post("/rate/save", isAuthenticated, dashboardController.saveRate);
router.post("/rate/delete", isAuthenticated, dashboardController.deleteRate);

export default router;
