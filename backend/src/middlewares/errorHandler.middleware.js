import { ApiError } from "../utils/ApiError.js"
import logger from "../utils/logger.js"

/**
 * Global error-handling middleware.
 * Must be registered LAST in app.js (after all routes).
 * Signature must have exactly 4 args for Express to treat it as error middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // ── Log the full error server-side ──────────────────────────────────────
  logger.error(
    `[${req.method} ${req.originalUrl}] ${err.statusCode || 500} —`,
    err.message,
    err.stack
  )

  // ── Mongoose validation errors ──────────────────────────────────────────
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors,
    })
  }

  // ── Mongoose CastError (invalid ObjectId) ───────────────────────────────
  if (err.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Invalid ID format",
      errors: [],
    })
  }

  // ── Mongoose duplicate key ───────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field"
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message: `${field} already exists`,
      errors: [],
    })
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Invalid token",
      errors: [],
    })
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Token expired",
      errors: [],
    })
  }

  // ── Multer errors ────────────────────────────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      statusCode: 413,
      success: false,
      message: "File too large",
      errors: [],
    })
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Unexpected file field",
      errors: [],
    })
  }

  // ── Our own ApiError ─────────────────────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      errors: err.errors,
    })
  }

  // ── Unknown / unexpected error ───────────────────────────────────────────
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: "Internal server error",
    errors: [],
  })
}

export { errorHandler }
