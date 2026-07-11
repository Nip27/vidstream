import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const MAX_TWEET_LENGTH = 280

// ─────────────────────────────────────────────
// CREATE TWEET
// ─────────────────────────────────────────────
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }

  if (content.trim().length > MAX_TWEET_LENGTH) {
    throw new ApiError(400, `Tweet must be under ${MAX_TWEET_LENGTH} characters`)
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

// ─────────────────────────────────────────────
// GET USER TWEETS
// ─────────────────────────────────────────────
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId")
  }

  const tweets = await Tweet.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [{ $project: { likedBy: 1 } }],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likeDetails" },
        ownerDetails: { $first: "$ownerDetails" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id ?? null, "$likeDetails.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})

// ─────────────────────────────────────────────
// UPDATE TWEET
// ─────────────────────────────────────────────
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId")
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required")
  }

  if (content.trim().length > MAX_TWEET_LENGTH) {
    throw new ApiError(400, `Tweet must be under ${MAX_TWEET_LENGTH} characters`)
  }

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw new ApiError(404, "Tweet not found")

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the tweet owner can edit it")
  }

  const updated = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content: content.trim() } },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Tweet updated successfully"))
})

// ─────────────────────────────────────────────
// DELETE TWEET
// ─────────────────────────────────────────────
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId")
  }

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw new ApiError(404, "Tweet not found")

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the tweet owner can delete it")
  }

  await Tweet.findByIdAndDelete(tweetId)

  return res
    .status(200)
    .json(new ApiResponse(200, { tweetId }, "Tweet deleted successfully"))
})

// ─────────────────────────────────────────────
// GET FEED TWEETS (from subscribed channels)
// ─────────────────────────────────────────────
const getFeedTweets = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({
    subscriber: req.user._id,
  }).select("channel")

  const channelIds = subscriptions.map((s) => s.channel)
  channelIds.push(req.user._id) // include own tweets

  const tweets = await Tweet.aggregate([
    { $match: { owner: { $in: channelIds } } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: { username: 1, avatar: 1, fullName: 1 } }],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [{ $project: { likedBy: 1 } }],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likeDetails" },
        ownerDetails: { $first: "$ownerDetails" },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likeDetails.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Feed tweets fetched successfully"))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet, getFeedTweets }
