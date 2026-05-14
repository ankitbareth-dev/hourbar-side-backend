import { Router } from "express";
import * as apiController from "../controllers/api.controller.js";
import * as icalService from "../services/ical.service.js";

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

export default router;
