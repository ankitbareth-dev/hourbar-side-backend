const AppError = require("../utils/AppError");

/**
 * Global error‑handling middleware.
 * - Operational errors (AppError) → user‑friendly message
 * - Unknown errors → generic 500 message
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : "Something went wrong. Please try again.";

  console.error(`[Error] ${statusCode} – ${message}`);
  if (!err.isOperational) {
    console.error(err.stack);
  }

  // ── API requests → JSON ──────────────────────────────────
  if (req.path.startsWith("/api/")) {
    return res.status(statusCode).json({ success: false, error: message });
  }

  // ── Page requests → redirect or render ───────────────────
  if (statusCode === 401 || statusCode === 403) {
    return res.redirect("/");
  }

  res.status(statusCode).render("login", { error: message });
};

/**
 * 404 catch‑all — creates an AppError and forwards it
 * to the global error handler.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Page not found: ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, notFound };
