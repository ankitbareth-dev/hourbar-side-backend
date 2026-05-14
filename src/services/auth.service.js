import Admin from "../models/Admin.js";
import AppError from "../utils/AppError.js";

export const findAdminByUsername = async (username) => {
  return await Admin.findOne({ where: { username } });
};

export const validateCredentials = async (username, password) => {
  const admin = await findAdminByUsername(username);

  if (!admin || admin.password !== password) {
    throw new AppError("Invalid username or password.", 401);
  }

  return admin;
};
