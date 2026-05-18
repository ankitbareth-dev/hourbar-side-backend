import { SeasonalRate } from "../models/index.js";
import Setting from "../models/Setting.js";
import AppError from "../utils/AppError.js";

/**
 * Calculates the full itemized booking quote.
 * Mirrors the logic from the legacy PHP calculation engine.
 */
export const calculateQuote = async (checkIn, checkOut, guests, pets) => {
  const settings = await Setting.findByPk(1);
  if (!settings) throw new AppError("Property settings not configured.", 400);

  // 1. Parse Dates (Force UTC to prevent timezone shifts)
  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  const today = new Date(new Date().setUTCHours(0, 0, 0, 0));

  if (start < today)
    throw new AppError("Check-in date cannot be in the past.", 400);
  if (end <= start)
    throw new AppError("Check-out must be after check-in.", 400);

  const totalNights = Math.round((end - start) / (1000 * 60 * 60 * 24));

  // 2. Fetch Rates
  const standardRate = await SeasonalRate.findOne({
    where: { startDate: null, endDate: null },
  });
  const seasonalRates = await SeasonalRate.findAll();

  if (!standardRate) throw new AppError("No standard rate configured.", 400);

  // 3. Loop Through Nights & Calculate Base Accommodation
  let accommodationTotal = 0;
  let current = new Date(start);

  while (current < end) {
    const currentStr = current.toISOString().split("T")[0];
    const dayName = current.toLocaleDateString("en-US", { weekday: "short" });

    // Find applicable rate (Seasonal or Standard)
    let appliedRate = seasonalRates.find((r) => {
      return (
        r.startDate &&
        r.endDate &&
        currentStr >= r.startDate &&
        currentStr <= r.endDate
      );
    });

    if (!appliedRate) appliedRate = standardRate;

    const weekendDays = appliedRate.weekendDays
      ? appliedRate.weekendDays.split(",")
      : [];
    const isWeekend = weekendDays.includes(dayName);

    accommodationTotal += isWeekend
      ? parseFloat(appliedRate.weekendPrice)
      : parseFloat(appliedRate.nightlyPrice);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // 4. Calculate Fees
  let totalCleaning = parseFloat(settings.cleaningFee) || 0;
  if (settings.cleaningFeeType === "Per Night") totalCleaning *= totalNights;

  let totalPetFee = 0;
  if (pets > 0) {
    totalPetFee = parseFloat(settings.petFee) || 0;
    if (settings.petFeeType === "Per Night")
      totalPetFee = totalPetFee * pets * totalNights;
    else totalPetFee = totalPetFee * pets;
  }

  let totalGuestFee = 0;
  const threshold = settings.extraGuestThreshold || 2;
  if (guests > threshold) {
    const extraGuests = guests - threshold;
    totalGuestFee = parseFloat(settings.extraGuestFee) || 0;
    if (settings.extraGuestFeeType === "Per Guest Per Night")
      totalGuestFee = totalGuestFee * extraGuests * totalNights;
    else totalGuestFee = totalGuestFee * extraGuests;
  }

  // 5. Calculate Tax
  let taxableAmount = accommodationTotal;
  if (settings.cleaningFeeTaxable) taxableAmount += totalCleaning;
  if (settings.petFeeTaxable) taxableAmount += totalPetFee;
  if (settings.extraGuestTaxable) taxableAmount += totalGuestFee;

  const taxRate = parseFloat(settings.propertyTaxRate) || 0;
  const totalTax = taxableAmount * (taxRate / 100);

  // 6. Calculate Totals
  const damageDeposit = parseFloat(settings.damageDeposit) || 0;
  const grandTotal =
    accommodationTotal +
    totalCleaning +
    totalPetFee +
    totalGuestFee +
    totalTax +
    damageDeposit;

  // 7. Return Itemized Receipt
  return {
    checkIn: start.toISOString().split("T")[0],
    checkOut: end.toISOString().split("T")[0],
    totalNights,
    guests,
    pets,
    breakdown: {
      accommodation: accommodationTotal,
      cleaningFee: totalCleaning,
      petFee: totalPetFee,
      extraGuestFee: totalGuestFee,
      tax: totalTax,
      damageDeposit: damageDeposit,
    },
    grandTotal,
  };
};
