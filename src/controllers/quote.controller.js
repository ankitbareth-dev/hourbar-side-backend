import * as quoteService from "../services/quote.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getQuote = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests, pets } = req.body;

  if (!checkIn || !checkOut) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Check-in and Check-out dates are required.",
      });
  }

  const quote = await quoteService.calculateQuote(
    checkIn,
    checkOut,
    guests || 1,
    pets || 0,
  );

  res.json({ success: true, quote });
});
