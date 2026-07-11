import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

/**
 * Strict JWT guard — rejects requests with no/invalid token.
 * Use on all protected routes.
 */
export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new ApiError(401, "Unauthorized — no token provided")
  }

  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired")
    }
    throw new ApiError(401, "Invalid access token")
  }

  const user = await User.findById(decodedToken._id).select(
    "-password -refreshToken"
  )

  if (!user) {
    throw new ApiError(401, "Invalid access token — user not found")
  }

  req.user = user
  next()
})

/**
 * Optional JWT — sets req.user if a valid token is present,
 * but does NOT block the request if no token is provided.
 * Use on public routes that show richer data for logged-in users
 * (e.g., GET /videos shows isLiked/isSubscribed when authenticated).
 */
export const optionalVerifyJWT = async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "")

  if (!token) return next()

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    )
    if (user) req.user = user
  } catch {
    // Invalid/expired token on a public route — just ignore it
  }

  next()
}