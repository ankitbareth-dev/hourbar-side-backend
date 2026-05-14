import { Router } from "express";
import * as apiController from "../controllers/api.controller.js";

const router = Router();

// Clean endpoint to get rates
router.get("/api/rates", apiController.getRates);

export default router;
