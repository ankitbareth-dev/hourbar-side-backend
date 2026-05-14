import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class SeasonalRate extends Model {}

SeasonalRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seasonName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nightlyPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weekendPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weekendDays: {
      type: DataTypes.STRING,
      defaultValue: "Fri,Sat",
    },
    minStay: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    weeklyDiscount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    monthlyDiscount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "seasonal_rates",
    timestamps: false,
    underscored: true,
  },
);

export default SeasonalRate;
