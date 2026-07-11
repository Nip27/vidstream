import { Router } from "express"
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  searchUsers,
} from "../controllers/user.controller.js"
import { upload, enforceImageSizeLimit } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { authRateLimiter } from "../middlewares/rateLimiter.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"

const router = Router()

// ── Public routes ─────────────────────────────────────────────────────────────
router.route("/register").post(
  authRateLimiter,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  enforceImageSizeLimit,
  validate({
    fullName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, isEmail: true },
    username: { required: true, minLength: 3, maxLength: 30 },
    password: { required: true, minLength: 8 },
  }),
  registerUser
)

router.route("/login").post(
  authRateLimiter,
  validate({
    password: { required: true },
  }),
  loginUser
)

router.route("/refresh-token").post(refreshAccessToken)
router.route("/search").get(searchUsers)

// ── Protected routes ──────────────────────────────────────────────────────────
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/change-password").post(
  verifyJWT,
  validate({
    oldPassword: { required: true },
    newPassword: { required: true, minLength: 8 },
  }),
  changeCurrentPassword
)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(
  verifyJWT,
  validate({
    fullName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, isEmail: true },
  }),
  updateAccountDetails
)

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), enforceImageSizeLimit, updateUserAvatar)

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), enforceImageSizeLimit, updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router