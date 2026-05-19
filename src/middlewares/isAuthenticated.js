/**
 * Redirects page requests to login or returns 403 JSON for API requests
 * when the user is not authenticated.
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.admin_logged_in) {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Please log in via the browser first." });
  }

  res.redirect("/");
};

module.exports = isAuthenticated;
