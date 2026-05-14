import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class PropertyPrice extends Model {}

PropertyPrice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyName: {
      type: DataTypes.STRING,
    },
    cleaningFee: {
      type: DataTypes.DECIMAL(10, 2),
    },
    petFee: {
      type: DataTypes.DECIMAL(10, 2),
    },
    propertyTaxRate: {
      type: DataTypes.DECIMAL(10, 2),
    },
    cleaningFeeTaxable: {
      type: DataTypes.BOOLEAN,
    },
    petFeeTaxable: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    sequelize,
    tableName: "property_prices",
    timestamps: false,
    underscored: true,
  },
);

export default PropertyPrice;
