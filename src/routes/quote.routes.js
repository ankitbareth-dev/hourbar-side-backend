import { Router } from "express";
import * as quoteController from "../controllers/quote.controller.js";

const router = Router();

// Public endpoint - no authentication required
router.post("/api/quote", quoteController.getQuote);

export default router;
