import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Admin extends Model {}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "admin",
    timestamps: false,
    underscored: true,
  },
);

export default Admin;
