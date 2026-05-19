const { Router } = require("express");
const apiController = require("../controllers/api.controller");
const icalService = require("../services/ical.service");

const router = Router();

router.get("/api/rates", apiController.getRates);

router.get("/api/booked-dates", async (req, res) => {
  try {
    const data = await icalService.syncIcalEvents();
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Error syncing calendar for public API:", err.message);
    res.json({
      success: false,
      error: err.message || "Could not fetch calendar data.",
      data: { bookedDates: [], startDates: [], endDates: [] },
    });
  }
});

module.exports = router;
