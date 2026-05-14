/**
 * Calculates Weekly (6 nights) and Monthly (29 nights) rates based on the
 * exact proportion of weekend vs standard nights in the season.
 */
export const calculateDynamicRates = (rate) => {
  const weekendDaysArr = rate.weekendDays ? rate.weekendDays.split(",") : [];
  const nightly = parseFloat(rate.nightlyPrice);
  const weekend = parseFloat(rate.weekendPrice);

  let weeklyRate = "-";
  let monthlyRate = "-";

  if (rate.startDate && rate.endDate) {
    // Appending T00:00:00 prevents Javascript UTC timezone shift bugs
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
