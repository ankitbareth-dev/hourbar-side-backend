import * as quoteService from "../services/quote.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getQuote = asyncHandler(async (req, res) => {
  const quote = await quoteService.calculateQuote(req.body);

  res.json({ success: true, quote });
});
