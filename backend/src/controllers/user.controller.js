import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import logger from "../utils/logger.js"

// ── Cookie options ────────────────────────────────────────────────────────────
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in ms
})

const accessTokenCookieOptions = () => ({
  ...cookieOptions(),
  maxAge: 24 * 60 * 60 * 1000, // 1 day
})

// ── Helper: generate and persist both tokens ──────────────────────────────────
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(500, "User not found while generating tokens")

  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })

  return { accessToken, refreshToken }
}

// ─────────────────────────────────────────────
// REGISTER USER
// ─────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body

  // Validation is handled by validate middleware on the route,
  // but we keep a final guard here for safety
  if ([fullName, email, username, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  })

  if (existedUser) {
    // Clean up any uploaded temp files before throwing
    if (req.files?.avatar?.[0]?.path) {
      const fs = await import("fs")
      try { fs.default.unlinkSync(req.files.avatar[0].path) } catch {}
    }
    throw new ApiError(409, "User with this email or username already exists")
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null

  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed — please try again")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email.toLowerCase(),
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "User registration failed — please try again")
  }

  logger.info(`New user registered: ${createdUser.username}`)

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"))
})

// ─────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "Email or username is required")
  }

  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  })

  // Use the same error message for not-found and wrong-password
  // to prevent user enumeration attacks
  if (!user) {
    throw new ApiError(401, "Invalid credentials")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  logger.info(`User logged in: ${loggedInUser.username}`)

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, cookieOptions())
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken, // included for clients that can't use cookies (e.g. mobile)
        },
        "User logged in successfully"
      )
    )
})

// ─────────────────────────────────────────────
// LOGOUT USER
// ─────────────────────────────────────────────
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  )

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions())
    .clearCookie("refreshToken", cookieOptions())
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

// ─────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required")
  }

  let decodedToken
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token")
  }

  const user = await User.findById(decodedToken?._id)

  if (!user) {
    throw new ApiError(401, "Invalid refresh token — user not found")
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token has been revoked — please log in again")
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user._id)

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions())
    .cookie("refreshToken", newRefreshToken, cookieOptions())
    .json(
      new ApiResponse(
        200,
        { accessToken },
        "Access token refreshed successfully"
      )
    )
})

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required")
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters")
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password must differ from old password")
  }

  const user = await User.findById(req.user._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

// ─────────────────────────────────────────────
// UPDATE ACCOUNT DETAILS
// ─────────────────────────────────────────────
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!fullName?.trim() || !email?.trim()) {
    throw new ApiError(400, "Full name and email are required")
  }

  // Check if new email is already taken by another user
  const emailConflict = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.user._id },
  })
  if (emailConflict) {
    throw new ApiError(409, "Email is already in use")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName: fullName.trim(), email: email.toLowerCase() } },
    { new: true }
  ).select("-password -refreshToken")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

// ─────────────────────────────────────────────
// UPDATE AVATAR
// ─────────────────────────────────────────────
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const oldUser = await User.findById(req.user._id).select("avatar")
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar?.url) {
    throw new ApiError(500, "Avatar upload failed")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken")

  // Delete old avatar from Cloudinary after successful update
  if (oldUser?.avatar) {
    await deleteFromCloudinary(oldUser.avatar)
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

// ─────────────────────────────────────────────
// UPDATE COVER IMAGE
// ─────────────────────────────────────────────
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required")
  }

  const oldUser = await User.findById(req.user._id).select("coverImage")
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage?.url) {
    throw new ApiError(500, "Cover image upload failed")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken")

  // Delete old cover from Cloudinary
  if (oldUser?.coverImage) {
    await deleteFromCloudinary(oldUser.coverImage)
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))
})

// ─────────────────────────────────────────────
// GET USER CHANNEL PROFILE
// ─────────────────────────────────────────────
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required")
  }

  const channel = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1,
      },
    },
  ])

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
})

// ─────────────────────────────────────────────
// GET WATCH HISTORY
// ─────────────────────────────────────────────
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          { $match: { isPublished: true } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                { $project: { fullName: 1, username: 1, avatar: 1 } },
              ],
            },
          },
          { $addFields: { owner: { $first: "$owner" } } },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

// ─────────────────────────────────────────────
// SEARCH USERS / CHANNELS
// ─────────────────────────────────────────────
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query

  if (!query?.trim()) {
    throw new ApiError(400, "Search query is required")
  }

  // Escape regex special characters to prevent ReDoS
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const users = await User.find({
    $or: [
      { username: { $regex: safeQuery, $options: "i" } },
      { fullName: { $regex: safeQuery, $options: "i" } },
    ],
  })
    .select("-password -refreshToken -watchHistory -email")
    .limit(10)

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  searchUsers,
}