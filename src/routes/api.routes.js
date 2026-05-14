import { Router } from "express";

import * as apiController from "../controllers/api.controller.js";

const router = Router();

router.get("/api/rates/:propertyName", apiController.getRatesByPropertyName);

export default router;
