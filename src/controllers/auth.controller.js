import * as authService from "../services/auth.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const showLogin = (req, res) => {
  if (req.session.admin_logged_in) {
    return res.redirect("/dashboard");
  }
  res.render("login", { title: "Admin Login | HARBOURSIDE519", error: "" }); // Added title
};

export const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", {
      title: "Admin Login | HARBOURSIDE519", // Added title
      error: "Please enter both email and password.",
    });
  }

  try {
    const admin = await authService.validateCredentials(email, password);
    req.session.admin_logged_in = true;
    req.session.admin_id = admin.id;
    req.session.admin_email = admin.email;
    return res.redirect("/dashboard");
  } catch (err) {
    if (err.isOperational && err.statusCode === 401) {
      return res.render("login", {
        title: "Admin Login | HARBOURSIDE519", // Added title
        error: err.message,
      });
    }
    throw err;
  }
});
export const handleLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
