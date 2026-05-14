import { Sequelize } from "sequelize";
import { SeasonalRate } from "../models/index.js";
import AppError from "../utils/AppError.js";

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
  const deletedRows = await SeasonalRate.destroy({ where: { id } });
  if (deletedRows === 0) {
    throw new AppError("Rate not found.", 404);
  }
  return deletedRows;
};

export const upsertRate = async (rateData) => {
  const { id, ...data } = rateData;

  if (data.startDate === "") data.startDate = null;
  if (data.endDate === "") data.endDate = null;
  data.minStay = data.minStay || 1;

  if (id) {
    await updateRate(id, data);
    return { updated: true };
  }

  await createRate(data);
  return { created: true };
};
