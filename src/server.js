import app from "./app.js";
import sequelize from "./config/database.js";
import { startCronJobs } from "./cron/ical.cron.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();

    startCronJobs();

    try {
      const data = await icalService.syncIcalEvents();
    } catch (err) {}

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  }
};

start();
