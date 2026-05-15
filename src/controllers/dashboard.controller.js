import * as rateService from "../services/rate.service.js"; // Removed propertyService import
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";
import * as icalService from "../services/ical.service.js";

export const showDashboard = asyncHandler(async (req, res) => {
  try {
    const rates = await rateService.getAllRates();
    const processedRates = rates.map(calculateDynamicRates);

    const icalUrl = await icalService.getIcalUrl();
    let calendarData = { bookedDates: [], startDates: [], endDates: [] };

    try {
      if (icalUrl) calendarData = await icalService.syncIcalEvents();
    } catch (err) {
      console.error("Calendar sync failed:", err.message);
    }

    res.render("dashboard", {
      title: "Admin Dashboard | HARBOURSIDE519", // Added title
      username: req.session.admin_email,
      rates: processedRates,
      icalUrl,
      calendarData,
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      title: "Admin Dashboard | HARBOURSIDE519", // Added title
      username: req.session.admin_email,
      rates: [],
      icalUrl: "", // Added fallback
      calendarData: { bookedDates: [], startDates: [], endDates: [] }, // Added fallback
    });
  }
});

export const saveIcalUrl = asyncHandler(async (req, res) => {
  const { ical_url } = req.body;
  await icalService.updateIcalUrl(ical_url);
  res.redirect("/dashboard");
});

export const syncCalendar = asyncHandler(async (req, res) => {
  const data = await icalService.syncIcalEvents();
  res.json({ success: true, data });
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
