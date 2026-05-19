const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Admin extends Model {}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      // Changed from username
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
    tableName: "admins", // Changed from admin
    timestamps: false,
    underscored: true,
  },
);

module.exports = Admin;
