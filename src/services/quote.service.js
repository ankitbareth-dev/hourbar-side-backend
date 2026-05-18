import { Op } from "sequelize";
import { SeasonalRate } from "../models/index.js";
import Setting from "../models/Setting.js";
import AppError from "../utils/AppError.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const US_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const buildDateOnly = (year, month, day, fieldName) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate) {
    throw new AppError(`${fieldName} is not a valid date.`, 400);
  }

  return { date, value: formatDateOnly(date) };
};

const normalizeYear = (year) => {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
};

const parseDateOnly = (value, fieldName) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;

  if (typeof normalizedValue !== "string") {
    throw new AppError(
      `${fieldName} must be in YYYY-MM-DD or MM/DD/YY format.`,
      400,
    );
  }

  if (DATE_ONLY_RE.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split("-").map(Number);
    return buildDateOnly(year, month, day, fieldName);
  }

  const usDateMatch = normalizedValue.match(US_DATE_RE);
  if (usDateMatch) {
    const [, month, day, year] = usDateMatch;
    return buildDateOnly(
      normalizeYear(Number(year)),
      Number(month),
      Number(day),
      fieldName,
    );
  }

  throw new AppError(
    `${fieldName} must be in YYYY-MM-DD or MM/DD/YY format.`,
    400,
  );
};

const parseModelDateOnly = (value, fieldName) => {
  if (typeof value !== "string" || !DATE_ONLY_RE.test(value)) {
    throw new AppError(`${fieldName} must be in YYYY-MM-DD format.`, 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isRealDate) {
    throw new AppError(`${fieldName} is not a valid date.`, 400);
  }

  return { date, value };
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const getTodayUtc = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

const parseWholeNumber = (value, fieldName, defaultValue = 0) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  if (
    normalizedValue === undefined ||
    normalizedValue === null ||
    normalizedValue === ""
  ) {
    return defaultValue;
  }

  const numberValue = Number(normalizedValue);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new AppError(`${fieldName} must be a whole number greater than or equal to 0.`, 400);
  }

  return numberValue;
};

const parseOptionalWholeNumber = (value, fieldName) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  if (
    normalizedValue === undefined ||
    normalizedValue === null ||
    normalizedValue === ""
  ) {
    return null;
  }

  const numberValue = Number(normalizedValue);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new AppError(
      `${fieldName} must be a whole number greater than or equal to 0.`,
      400,
    );
  }

  return numberValue;
};

const parseRequiredGuests = (input) => {
  const adults = parseOptionalWholeNumber(
    input.adults ?? input.adultCount ?? input.adult_count,
    "Adults",
  );
  const children = parseOptionalWholeNumber(
    input.children ?? input.childCount ?? input.child_count,
    "Children",
  );
  const infants = parseWholeNumber(
    input.infants ?? input.infantCount ?? input.infant_count,
    "Infants",
    0,
  );
  const guestCount = parseWholeNumber(
    input.guests ?? input.totalGuests ?? input.total_guests,
    "Guests",
    null,
  );

  const guests =
    guestCount !== null
      ? guestCount
      : adults !== null || children !== null
        ? (adults || 0) + (children || 0)
        : 1;

  if (guests < 1) {
    throw new AppError("At least one paying guest is required.", 400);
  }

  return {
    guests,
    adults,
    children,
    infants,
  };
};

const normalizeInput = (inputOrCheckIn, checkOut, guests, pets) => {
  const input =
    typeof inputOrCheckIn === "object" && inputOrCheckIn !== null
      ? inputOrCheckIn
      : { checkIn: inputOrCheckIn, checkOut, guests, pets };

  const checkInValue =
    input.checkIn ?? input.check_in ?? input.startDate ?? input.start_date;
  const checkOutValue =
    input.checkOut ?? input.check_out ?? input.endDate ?? input.end_date;

  const start = parseDateOnly(checkInValue, "Check-in date");
  const end = parseDateOnly(checkOutValue, "Check-out date");
  const guestInfo = parseRequiredGuests(input);
  const petCount = parseWholeNumber(
    input.pets ?? input.petCount ?? input.pet_count,
    "Pets",
    0,
  );

  return {
    checkIn: start.value,
    checkOut: end.value,
    start: start.date,
    end: end.date,
    pets: petCount,
    ...guestInfo,
  };
};

const normalizeWeekendDays = (weekendDays) => {
  if (!weekendDays) return [];
  if (Array.isArray(weekendDays)) return weekendDays;
  return weekendDays
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);
};

const rateDuration = (rate) => {
  if (!rate.startDate || !rate.endDate) return Number.MAX_SAFE_INTEGER;
  const start = parseModelDateOnly(rate.startDate, "Season start date").date;
  const end = parseModelDateOnly(rate.endDate, "Season end date").date;
  return Math.max(1, Math.round((end - start) / MS_PER_DAY));
};

const chooseRateForNight = (dateStr, seasonalRates, standardRate) => {
  const matchingRates = seasonalRates.filter(
    (rate) => dateStr >= rate.startDate && dateStr < rate.endDate,
  );

  if (matchingRates.length === 0) return standardRate || null;

  return matchingRates.sort((a, b) => {
    const durationDiff = rateDuration(a) - rateDuration(b);
    if (durationDiff !== 0) return durationDiff;

    if (a.startDate !== b.startDate) {
      return a.startDate < b.startDate ? 1 : -1;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  })[0];
};

export const calculateQuote = async (...args) => {
  const input = normalizeInput(...args);
  const settings = await Setting.findByPk(1);
  if (!settings) throw new AppError("Property settings not configured.", 400);

  const today = getTodayUtc();
  if (input.start < today) {
    throw new AppError("Check-in date cannot be in the past.", 400);
  }
  if (input.end <= input.start) {
    throw new AppError("Check-out must be after check-in.", 400);
  }

  const totalNights = Math.round((input.end - input.start) / MS_PER_DAY);

  const [standardRate, seasonalRates] = await Promise.all([
    SeasonalRate.findOne({
      where: {
        startDate: { [Op.is]: null },
        endDate: { [Op.is]: null },
      },
      order: [["id", "DESC"]],
    }),
    SeasonalRate.findAll({
      where: {
        startDate: { [Op.ne]: null },
        endDate: { [Op.ne]: null },
      },
      order: [
        ["startDate", "DESC"],
        ["id", "DESC"],
      ],
    }),
  ]);

  let accommodationTotal = 0;
  let minStayRequired = 1;
  const nightlyRates = [];
  const current = new Date(input.start);

  while (current < input.end) {
    const date = formatDateOnly(current);
    const dayName = current.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    const appliedRate = chooseRateForNight(date, seasonalRates, standardRate);
    if (!appliedRate) {
      throw new AppError(
        `No rate configured for ${date}. Add a seasonal rate for this date or configure the Regular / Default Price.`,
        400,
      );
    }

    const weekendDays = normalizeWeekendDays(appliedRate.weekendDays);
    const isWeekend = weekendDays.includes(dayName);
    const nightlyAmount = isWeekend
      ? parseFloat(appliedRate.weekendPrice)
      : parseFloat(appliedRate.nightlyPrice);

    accommodationTotal += nightlyAmount;
    minStayRequired = Math.max(minStayRequired, Number(appliedRate.minStay || 1));
    nightlyRates.push({
      date,
      rateId: appliedRate.id,
      seasonName: appliedRate.seasonName,
      dayName,
      isWeekend,
      amount: toMoney(nightlyAmount),
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (totalNights < minStayRequired) {
    throw new AppError(
      `This stay requires at least ${minStayRequired} night${minStayRequired === 1 ? "" : "s"}.`,
      400,
    );
  }

  let totalCleaning = parseFloat(settings.cleaningFee) || 0;
  if (settings.cleaningFeeType === "Per Night") totalCleaning *= totalNights;

  let totalPetFee = 0;
  if (input.pets > 0) {
    totalPetFee = parseFloat(settings.petFee) || 0;
    if (settings.petFeeType === "Per Night") {
      totalPetFee = totalPetFee * input.pets * totalNights;
    } else {
      totalPetFee = totalPetFee * input.pets;
    }
  }

  let totalGuestFee = 0;
  const threshold = Number(settings.extraGuestThreshold || 2);
  if (input.guests > threshold) {
    const extraGuests = input.guests - threshold;
    totalGuestFee = parseFloat(settings.extraGuestFee) || 0;
    if (settings.extraGuestFeeType === "Per Guest Per Night") {
      totalGuestFee = totalGuestFee * extraGuests * totalNights;
    } else {
      totalGuestFee = totalGuestFee * extraGuests;
    }
  }

  let taxableAmount = accommodationTotal;
  if (settings.cleaningFeeTaxable) taxableAmount += totalCleaning;
  if (settings.petFeeTaxable) taxableAmount += totalPetFee;
  if (settings.extraGuestTaxable) taxableAmount += totalGuestFee;

  const taxRate = parseFloat(settings.propertyTaxRate) || 0;
  const totalTax = taxableAmount * (taxRate / 100);
  const damageDeposit = parseFloat(settings.damageDeposit) || 0;
  const grandTotal =
    accommodationTotal +
    totalCleaning +
    totalPetFee +
    totalGuestFee +
    totalTax +
    damageDeposit;

  return {
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    totalNights,
    guests: input.guests,
    adults: input.adults,
    children: input.children,
    infants: input.infants,
    pets: input.pets,
    minStayRequired,
    breakdown: {
      accommodation: toMoney(accommodationTotal),
      cleaningFee: toMoney(totalCleaning),
      petFee: toMoney(totalPetFee),
      extraGuestFee: toMoney(totalGuestFee),
      tax: toMoney(totalTax),
      damageDeposit: toMoney(damageDeposit),
    },
    nightlyRates,
    policies: {
      rentalNotes: settings.rentalNotes || null,
      cancellationPolicy: settings.cancellationPolicy || null,
    },
    grandTotal: toMoney(grandTotal),
  };
};
