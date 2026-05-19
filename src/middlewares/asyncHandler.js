/**
 * Wraps an async route handler so that rejected promises
 * are automatically forwarded to the global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
