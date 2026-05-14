import cron from "node-cron";
import * as icalService from "../services/ical.service.js";

export const startCronJobs = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏳ [Cron] Running hourly iCal sync...");
    try {
      const url = await icalService.getIcalUrl();

      if (!url) {
        console.log("ℹ️ [Cron] No iCal URL configured. Skipping sync.");
        return;
      }

      const data = await icalService.syncIcalEvents();
      console.log(
        `✅ [Cron] iCal sync successful. Found ${data.startDates.length} bookings.`,
      );
    } catch (err) {
      console.error("❌ [Cron] iCal sync failed:", err.message);
    }
  });

  console.log("✅ Cron jobs initialized (iCal sync scheduled every hour).");
};
