import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Setting extends Model {}

Setting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    icalUrl: { type: DataTypes.TEXT, allowNull: true },
    extraGuestTaxable: { type: DataTypes.BOOLEAN, defaultValue: true },
    extraGuestFeeType: {
      type: DataTypes.STRING(50),
      defaultValue: "Per Guest Per Night",
    },
    extraGuestFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    extraGuestThreshold: { type: DataTypes.INTEGER, defaultValue: 2 },
    cleaningFeeTaxable: { type: DataTypes.BOOLEAN, defaultValue: false },
    cleaningFeeType: { type: DataTypes.STRING(50), defaultValue: "Per Stay" },
    cleaningFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    petFeeTaxable: { type: DataTypes.BOOLEAN, defaultValue: false },
    petFeeType: { type: DataTypes.STRING(50), defaultValue: "Per Stay" },
    petFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    damageDeposit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    propertyTaxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 13.25 },
    rentalNotes: { type: DataTypes.TEXT, allowNull: true },
    cancellationPolicy: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "settings",
    timestamps: false,
    underscored: true,
  },
);

export default Setting;
