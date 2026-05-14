import Admin from "../models/Admin.js";
import AppError from "../utils/AppError.js";

// Changed function name and parameter to match the 'email' column
export const findAdminByEmail = async (email) => {
  return await Admin.findOne({ where: { email } });
};

export const validateCredentials = async (email, password) => {
  const admin = await findAdminByEmail(email);

  if (!admin || admin.password !== password) {
    throw new AppError("Invalid email or password.", 401);
  }

  return admin;
};
