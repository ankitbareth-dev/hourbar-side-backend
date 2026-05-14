import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Setting extends Model {}

Setting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    icalUrl: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "settings",
    timestamps: false,
    underscored: true,
  },
);

export default Setting;
