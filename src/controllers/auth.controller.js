import * as authService from "../services/auth.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const showLogin = (req, res) => {
  if (req.session.admin_logged_in) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: "" });
};

export const handleLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", {
      error: "Please enter both username and password.",
    });
  }

  try {
    const admin = await authService.validateCredentials(username, password);

    req.session.admin_logged_in = true;
    req.session.admin_id = admin.id;
    req.session.admin_username = admin.username;

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
