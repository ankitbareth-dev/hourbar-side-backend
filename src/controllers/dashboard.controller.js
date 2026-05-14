import * as rateService from "../services/rate.service.js"; // Removed propertyService import
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";

export const showDashboard = asyncHandler(async (req, res) => {
  try {
    // Fetch all rates directly (no propertyId needed anymore)
    const rates = await rateService.getAllRates();
    const processedRates = rates.map(calculateDynamicRates);

    res.render("dashboard", {
      username: req.session.admin_email, // Changed from admin_username to admin_email
      rates: processedRates, // No longer passing 'property' object to EJS
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      username: req.session.admin_email,
      rates: [],
    });
  }
});

export const saveRate = asyncHandler(async (req, res) => {
  const {
    id,
    season_name,
    start_date,
    end_date,
    nightly_price,
    weekend_price,
    min_stay,
  } = req.body;

  // Removed property_id from destructuring

  const weekend_days = req.body.weekend_days
    ? Array.isArray(req.body.weekend_days)
      ? req.body.weekend_days.join(",")
      : req.body.weekend_days
    : "Fri,Sat";

  await rateService.upsertRate({
    id: id || null,
    // propertyId removed
    seasonName: season_name,
    startDate: start_date === "" ? null : start_date,
    endDate: end_date === "" ? null : end_date,
    nightlyPrice: nightly_price,
    weekendPrice: weekend_price,
    weekendDays: weekend_days,
    minStay: min_stay || 1,
    // weeklyDiscount and monthlyDiscount removed
  });

  res.redirect("/dashboard");
});

export const deleteRate = asyncHandler(async (req, res) => {
  const { id } = req.body;
  await rateService.deleteRate(id);
  res.redirect("/dashboard");
});
