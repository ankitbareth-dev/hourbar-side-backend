const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");

// Changed function name and parameter to match the 'email' column
const findAdminByEmail = async (email) => {
  return await Admin.findOne({ where: { email } });
};

const validateCredentials = async (email, password) => {
  const admin = await findAdminByEmail(email);

  if (!admin || admin.password !== password) {
    throw new AppError("Invalid email or password.", 401);
  }

  return admin;
};

module.exports = { findAdminByEmail, validateCredentials };
