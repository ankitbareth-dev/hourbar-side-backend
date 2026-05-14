import { Sequelize } from "sequelize";
import { PropertyPrice, SeasonalRate } from "../models/index.js";
import AppError from "../utils/AppError.js";

export const getFirstProperty = async () => {
  return await PropertyPrice.findOne();
};

export const getPropertyByName = async (propertyName) => {
  const property = await PropertyPrice.findOne({
    where: { propertyName },
  });

  if (!property) {
    throw new AppError(`Property '${propertyName}' not found in database`, 404);
  }

  return property;
};

export const getPropertyWithRates = async () => {
  const property = await getFirstProperty();

  if (!property) return { property: null, rates: [] };

  const rates = await SeasonalRate.findAll({
    where: { propertyId: property.id },
    order: [
      [Sequelize.literal("season_name = 'Standard' DESC, start_date ASC")],
    ],
  });

  return { property, rates };
};

export const getPropertyRatesByName = async (propertyName) => {
  const property = await getPropertyByName(propertyName);

  const rates = await SeasonalRate.findAll({
    where: { propertyId: property.id },
    order: [
      [Sequelize.literal("season_name = 'Standard' DESC, start_date ASC")],
    ],
  });

  return { property, rates };
};
