import * as authService from "../services/auth.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const showLogin = (req, res) => {
  if (req.session.admin_logged_in) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: "" });
};

export const handleLogin = asyncHandler(async (req, res) => {
  // Changed 'username' to 'email' to match the new DB schema and form input
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", {
      error: "Please enter both email and password.",
    });
  }

  try {
    const admin = await authService.validateCredentials(email, password);

    req.session.admin_logged_in = true;
    req.session.admin_id = admin.id;
    req.session.admin_email = admin.email; // Changed to admin_email

    return res.redirect("/dashboard");
  } catch (err) {
    if (err.isOperational && err.statusCode === 401) {
      return res.render("login", { error: err.message });
    }
    throw err; // unexpected → global error handler
  }
});

export const handleLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
