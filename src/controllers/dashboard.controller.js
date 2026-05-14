import * as propertyService from "../services/property.service.js";
import * as rateService from "../services/rate.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

/**
 * Calculates Weekly and Monthly rates based on the
 * exact proportion of weekend vs standard nights in the season.
 */
const calculateDynamicRates = (rate) => {
  const weekendDaysArr = rate.weekendDays ? rate.weekendDays.split(",") : [];
  const nightly = parseFloat(rate.nightlyPrice);
  const weekend = parseFloat(rate.weekendPrice);

  let weeklyRate = "-";
  let monthlyRate = "-";

  if (rate.startDate && rate.endDate) {
    const start = new Date(rate.startDate + "T00:00:00");
    const end = new Date(rate.endDate + "T00:00:00");
    const totalNights = Math.round((end - start) / (1000 * 60 * 60 * 24));

    if (totalNights > 0) {
      let weekendNights = 0;

      // Count actual weekend nights within the season
      for (let i = 0; i < totalNights; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (weekendDaysArr.includes(dayName)) {
          weekendNights++;
        }
      }

      const standardNights = totalNights - weekendNights;
      const totalCost = standardNights * nightly + weekendNights * weekend;
      const avgPerNight = totalCost / totalNights;

      // 1 Week = 6 Nights
      weeklyRate = (avgPerNight * 6).toFixed(2);

      // 1 Month = 29 Nights (Only show if season is at least 29 days long)
      if (totalNights >= 29) {
        monthlyRate = (avgPerNight * 29).toFixed(2);
      }
    }
  }

  // Convert Sequelize instance to plain object and append dynamic rates
  const plainRate = rate.get ? rate.get({ plain: true }) : rate;
  return { ...plainRate, weeklyRate, monthlyRate };
};

export const showDashboard = asyncHandler(async (req, res) => {
  try {
    const { property, rates } = await propertyService.getPropertyWithRates();

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
