import rateLimit from "express-rate-limit"
import { ApiError } from "../utils/ApiError.js"

/**
 * Rate limiter for authentication endpoints.
 * 10 requests per 15 minutes per IP — blocks brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many requests from this IP. Please try again after 15 minutes."
      )
    )
  },
})

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, "Too many requests. Please slow down."))
  },
})
