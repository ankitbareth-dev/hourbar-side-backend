import { SeasonalRate } from "../models/index.js";
import AppError from "../utils/AppError.js";

export const createRate = async (rateData) => {
  return await SeasonalRate.create(rateData);
};

export const updateRate = async (id, propertyId, rateData) => {
  const [updatedRows] = await SeasonalRate.update(rateData, {
    where: { id, propertyId },
  });

  if (updatedRows === 0) {
    throw new AppError(
      "Rate not found or does not belong to this property.",
      404,
    );
  }

  return updatedRows;
};

export const deleteRate = async (id) => {
  const deletedRows = await SeasonalRate.destroy({ where: { id } });

  if (deletedRows === 0) {
    throw new AppError("Rate not found.", 404);
  }

  return deletedRows;
};

/**
 * Creates or updates a rate based on whether an `id` is provided.
 * Handles empty‑string → null conversion for date fields and defaults.
 */
export const upsertRate = async (rateData) => {
  const { id, propertyId, ...data } = rateData;

  if (data.startDate === "") data.startDate = null;
  if (data.endDate === "") data.endDate = null;

  data.minStay = data.minStay || 1;
  data.weeklyDiscount = data.weeklyDiscount || 0;
  data.monthlyDiscount = data.monthlyDiscount || 0;

  if (id) {
    await updateRate(id, propertyId, data);
    return { updated: true };
  }

  data.propertyId = propertyId;
  await createRate(data);
  return { created: true };
};
