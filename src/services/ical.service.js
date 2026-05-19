const ical = require("node-ical");
const Setting = require("../models/Setting");
const AppError = require("../utils/AppError");

// Helper to format Date object to YYYY-MM-DD safely (UTC)
const formatDt = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

const getIcalUrl = async () => {
  const setting = await Setting.findByPk(1);
  return setting?.icalUrl || "";
};

const updateIcalUrl = async (url) => {
  const setting = await Setting.findByPk(1);
  if (!setting) await Setting.create({ id: 1, icalUrl: url });
  else {
    setting.icalUrl = url;
    await setting.save();
  }
  return setting;
};

const syncIcalEvents = async () => {
  const setting = await Setting.findByPk(1);
  if (!setting || !setting.icalUrl) {
    throw new AppError("No iCal URL configured.", 400);
  }

  try {
    const data = await ical.async.fromURL(setting.icalUrl);

    const bookedDates = new Set();
    const startDates = new Set();
    const endDates = new Set();

    for (const event of Object.values(data)) {
      if (event.type === "VEVENT" && event.start && event.end) {
        const checkin = formatDt(event.start);
        const checkout = formatDt(event.end);

        startDates.add(checkin);
        endDates.add(checkout);

        // Fill all nights between check-in and check-out
        let current = new Date(event.start);
        const end = new Date(event.end);

        while (current < end) {
          bookedDates.add(formatDt(current));
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
    }

    return {
      bookedDates: Array.from(bookedDates),
      startDates: Array.from(startDates),
      endDates: Array.from(endDates),
    };
  } catch (err) {
    throw new AppError("Failed to fetch or parse iCal feed.", 500);
  }
};

module.exports = { getIcalUrl, updateIcalUrl, syncIcalEvents };
