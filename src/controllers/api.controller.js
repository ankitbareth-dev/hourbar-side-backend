import * as rateService from "../services/rate.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";

export const getRates = asyncHandler(async (req, res) => {
  const rates = await rateService.getAllRates();
  const processedRates = rates.map(calculateDynamicRates);
  const defaultRate = processedRates.find((r) => !r.startDate && !r.endDate);
  const seasonalRates = processedRates.filter((r) => r.startDate && r.endDate);

  const serializeRate = (r) => ({
    id: r.id,
    season_name: r.seasonName,
    start_date: r.startDate,
    end_date: r.endDate,
    nightly_price: parseFloat(r.nightlyPrice),
    weekend_price: parseFloat(r.weekendPrice),
    weekend_days: r.weekendDays,
    min_stay: r.minStay,
    weekly_price: r.weeklyRate === "-" ? null : parseFloat(r.weeklyRate),
    monthly_price: r.monthlyRate === "-" ? null : parseFloat(r.monthlyRate),
  });

  res.json({
    success: true,
    default_rate: defaultRate ? serializeRate(defaultRate) : null,
    seasonal_rates: seasonalRates.map(serializeRate),
  });
});
