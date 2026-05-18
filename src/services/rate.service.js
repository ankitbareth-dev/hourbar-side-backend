import { Op, Sequelize } from "sequelize";
import { SeasonalRate } from "../models/index.js";
import AppError from "../utils/AppError.js";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value, fieldName) => {
  if (value === null || value === undefined || value === "") return null;
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

  return value;
};

const parseMoney = (value, fieldName) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  if (
    normalizedValue === undefined ||
    normalizedValue === null ||
    normalizedValue === ""
  ) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const numberValue = Number(normalizedValue);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError(`${fieldName} must be a number greater than or equal to 0.`, 400);
  }

  return numberValue.toFixed(2);
};

const parsePositiveInteger = (value, fieldName) => {
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const numberValue = Number(normalizedValue || 1);
  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw new AppError(`${fieldName} must be a whole number greater than 0.`, 400);
  }

  return numberValue;
};

const normalizeRateData = (rateData) => {
  const data = { ...rateData };
  data.startDate = parseDateOnly(data.startDate, "Start date");
  data.endDate = parseDateOnly(data.endDate, "End date");
  data.nightlyPrice = parseMoney(data.nightlyPrice, "Nightly rate");
  data.weekendPrice = parseMoney(data.weekendPrice, "Weekend rate");
  data.minStay = parsePositiveInteger(data.minStay, "Minimum stay");
  data.weekendDays = data.weekendDays || "Fri,Sat";

  const isDefaultRate = !data.startDate && !data.endDate;
  if (isDefaultRate) {
    data.seasonName = "Standard";
    return data;
  }

  if (!data.startDate || !data.endDate) {
    throw new AppError("Seasonal rates require both a start date and an end date.", 400);
  }

  if (data.endDate <= data.startDate) {
    throw new AppError("Seasonal rate end date must be after start date.", 400);
  }

  if (!data.seasonName || !String(data.seasonName).trim()) {
    throw new AppError("Season name is required.", 400);
  }

  data.seasonName = String(data.seasonName).trim();
  return data;
};

// Gets all rates for the dashboard
export const getAllRates = async () => {
  return await SeasonalRate.findAll({
    order: [
      [Sequelize.literal("season_name = 'Standard' DESC, start_date ASC")],
    ],
  });
};

export const createRate = async (rateData) => {
  return await SeasonalRate.create(rateData);
};

export const updateRate = async (id, rateData) => {
  const [updatedRows] = await SeasonalRate.update(rateData, {
    where: { id },
  });
  if (updatedRows === 0) {
    throw new AppError("Rate not found.", 404);
  }
  return updatedRows;
};

export const deleteRate = async (id) => {
  const rate = await SeasonalRate.findByPk(id);
  if (!rate) {
    throw new AppError("Rate not found.", 404);
  }

  if (!rate.startDate && !rate.endDate) {
    throw new AppError("Default rate cannot be deleted. Update it instead.", 400);
  }

  const deletedRows = await SeasonalRate.destroy({ where: { id } });
  if (deletedRows === 0) {
    throw new AppError("Rate not found.", 404);
  }
  return deletedRows;
};

export const upsertRate = async (rateData) => {
  const { id, ...rawData } = rateData;
  const data = normalizeRateData(rawData);

  const isDefaultRate = !data.startDate && !data.endDate;

  if (id) {
    await updateRate(id, data);
    return { updated: true };
  }

  if (isDefaultRate) {
    const existingDefault = await SeasonalRate.findOne({
      where: {
        startDate: { [Op.is]: null },
        endDate: { [Op.is]: null },
      },
      order: [["id", "DESC"]],
    });

    if (existingDefault) {
      await updateRate(existingDefault.id, data);
      return { updated: true };
    }
  }

  await createRate(data);
  return { created: true };
};
