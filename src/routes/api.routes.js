import { Router } from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import * as apiController from "../controllers/api.controller.js";

const router = Router();

router.get(
  "/api/rates/:propertyName",
  isAuthenticated,
  apiController.getRatesByPropertyName,
);

export default router;
