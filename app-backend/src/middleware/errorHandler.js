/**
 * Global Express error handler
 * Catches any errors passed via next(err)
 * and returns a JSON response.
 */
export default function errorHandler(err, req, res, next) {
  // Log full error for diagnostics
  console.error(err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      // expose stack trace in dev only
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
