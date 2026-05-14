import * as propertyService from "../services/property.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js"; // Import utility

export const getRatesByPropertyName = asyncHandler(async (req, res) => {
  const { propertyName } = req.params;
  const { property, rates } =
    await propertyService.getPropertyRatesByName(propertyName);

  // Process rates through our shared calculator
  const processedRates = rates.map(calculateDynamicRates);

  res.json({
    success: true,
    property: {
      id: property.id,
      name: property.propertyName,
      cleaning_fee: parseFloat(property.cleaningFee),
      pet_fee: parseFloat(property.petFee),
      tax_rate_percent: parseFloat(property.propertyTaxRate),
      cleaning_fee_taxable: !!property.cleaningFeeTaxable,
      pet_fee_taxable: !!property.petFeeTaxable,
    },
    seasonal_rates: processedRates.map((r) => ({
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
    })),
  });
});
