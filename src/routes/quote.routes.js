const { Router } = require("express");
const quoteController = require("../controllers/quote.controller");

const router = Router();

// Public endpoint - no authentication required
router.post("/api/quote", quoteController.getQuote);

module.exports = router;
