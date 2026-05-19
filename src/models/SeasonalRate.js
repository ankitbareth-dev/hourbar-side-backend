const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class SeasonalRate extends Model {}

SeasonalRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
  },
  {
    sequelize,
    tableName: "seasonal_rates",
    timestamps: false,
    underscored: true,
  },
);

module.exports = SeasonalRate;
