import * as propertyService from "../services/property.service.js";
import * as rateService from "../services/rate.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const showDashboard = asyncHandler(async (req, res) => {
  try {
    const { property, rates } = await propertyService.getPropertyWithRates();

    res.render("dashboard", {
      username: req.session.admin_username,
      property,
      rates,
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
    weekly_discount,
    monthly_discount,
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
    weeklyDiscount: weekly_discount || 0,
    monthlyDiscount: monthly_discount || 0,
  });

  res.redirect("/dashboard");
});

export const deleteRate = asyncHandler(async (req, res) => {
  const { id } = req.body;
  await rateService.deleteRate(id);
  res.redirect("/dashboard");
});
