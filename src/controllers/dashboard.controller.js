import * as rateService from "../services/rate.service.js";
import * as icalService from "../services/ical.service.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";

// Helper to get or create the settings row
const getSettingsInstance = async () => {
  let setting = await Setting.findByPk(1);
  if (!setting) setting = await Setting.create({ id: 1 });
  return setting;
};

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

    const settings = await getSettingsInstance();

    res.render("dashboard", {
      username: req.session.admin_email,
      rates: processedRates,
      icalUrl,
      calendarData,
      settings,
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      username: req.session.admin_email,
      rates: [],
      icalUrl: "",
      calendarData: { bookedDates: [], startDates: [], endDates: [] },
      settings: {},
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

  const weekend_days = req.body.weekend_days
    ? Array.isArray(req.body.weekend_days)
      ? req.body.weekend_days.join(",")
      : req.body.weekend_days
    : "Fri,Sat";

  await rateService.upsertRate({
    id: id || null,
    seasonName: season_name,
    startDate: start_date === "" ? null : start_date,
    endDate: end_date === "" ? null : end_date,
    nightlyPrice: nightly_price,
    weekendPrice: weekend_price,
    weekendDays: weekend_days,
    minStay: min_stay || 1,
  });

  res.redirect("/dashboard");
});

export const deleteRate = asyncHandler(async (req, res) => {
  const { id } = req.body;
  await rateService.deleteRate(id);
  res.redirect("/dashboard");
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

// --- TAXES & POLICIES ---

export const saveTaxes = asyncHandler(async (req, res) => {
  const settings = await getSettingsInstance();

  settings.extraGuestTaxable = req.body.extra_guest_taxable === "on";
  settings.cleaningFeeTaxable = req.body.cleaning_fee_taxable === "on";
  settings.petFeeTaxable = req.body.pet_fee_taxable === "on";

  settings.extraGuestFeeType =
    req.body.extra_guest_fee_type || "Per Guest Per Night";
  settings.extraGuestFee = parseFloat(req.body.extra_guest_fee) || 0;
  settings.extraGuestThreshold = parseInt(req.body.extra_guest_threshold) || 2;

  settings.cleaningFeeType = req.body.cleaning_fee_type || "Per Stay";
  settings.cleaningFee = parseFloat(req.body.cleaning_fee) || 0;

  settings.petFeeType = req.body.pet_fee_type || "Per Stay";
  settings.petFee = parseFloat(req.body.pet_fee) || 0;

  settings.damageDeposit = parseFloat(req.body.damage_deposit) || 0;
  settings.propertyTaxRate = parseFloat(req.body.property_tax_rate) || 13.25;

  await settings.save();
  res.redirect("/dashboard");
});

export const savePolicies = asyncHandler(async (req, res) => {
  const settings = await getSettingsInstance();
  settings.rentalNotes = req.body.rental_notes || null;
  settings.cancellationPolicy = req.body.cancellation_policy || null;
  await settings.save();
  res.redirect("/dashboard");
});
