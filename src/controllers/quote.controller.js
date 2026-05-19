const quoteService = require("../services/quote.service");
const asyncHandler = require("../middlewares/asyncHandler");

const getQuote = asyncHandler(async (req, res) => {
  const quote = await quoteService.calculateQuote(req.body);

  res.json({ success: true, quote });
});

module.exports = { getQuote };
