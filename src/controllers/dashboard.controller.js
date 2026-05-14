import * as propertyService from "../services/property.service.js";
import * as rateService from "../services/rate.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js"; // Import utility

export const showDashboard = asyncHandler(async (req, res) => {
  try {
    const { property, rates } = await propertyService.getPropertyWithRates();

    // Use the shared utility
    const processedRates = rates.map(calculateDynamicRates);

    res.render("dashboard", {
      username: req.session.admin_username,
      property,
      rates: processedRates,
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      username: req.session.admin_username,
      property: null,
      rates: [],
    });
  }
});

export const saveRate = asyncHandler(async (req, res) => {
  const {
    id,
    property_id,
    season_name,
    start_date,
    end_date,
    nightly_price,
    weekend_price,
    min_stay,
  } = req.body;

  const weekend_days = req.body.weekend_days
    ? Array.isArray(req.body.weekend_days)
      ? req.body.weekend_days.join(",")
      : req.body.weekend_days
    : "Fri,Sat";

  await rateService.upsertRate({
    id: id || null,
    propertyId: parseInt(property_id, 10),
    seasonName: season_name,
    startDate: start_date === "" ? null : start_date,
    endDate: end_date === "" ? null : end_date,
    nightlyPrice: nightly_price,
    weekendPrice: weekend_price,
    weekendDays: weekend_days,
    minStay: min_stay || 1,
    weeklyDiscount: 0,
    monthlyDiscount: 0,
  });

  res.redirect("/dashboard");
});

export const deleteRate = asyncHandler(async (req, res) => {
  const { id } = req.body;
  await rateService.deleteRate(id);
  res.redirect("/dashboard");
});
