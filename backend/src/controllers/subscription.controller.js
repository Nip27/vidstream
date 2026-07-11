import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ─────────────────────────────────────────────
// TOGGLE SUBSCRIPTION
// ─────────────────────────────────────────────
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId")
  }

  // Prevent self-subscription
  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel")
  }

  const existing = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  })

  if (existing) {
    await Subscription.findByIdAndDelete(existing._id)
    return res
      .status(200)
      .json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"))
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { subscribed: true }, "Subscribed successfully"))
})

// ─────────────────────────────────────────────
// GET CHANNEL SUBSCRIBERS LIST
// ─────────────────────────────────────────────
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId")
  }

  const channelObjId = new mongoose.Types.ObjectId(channelId)

  const subscribers = await Subscription.aggregate([
    { $match: { channel: channelObjId } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: { $in: [channelObjId, "$subscribedToSubscriber.subscriber"] },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: { $size: "$subscribedToSubscriber" },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribedToSubscriber: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$subscriber" },
    {
      $project: {
        _id: 0,
        subscriber: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// ─────────────────────────────────────────────
// GET CHANNELS A USER HAS SUBSCRIBED TO
// ─────────────────────────────────────────────
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId")
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
              pipeline: [
                { $match: { isPublished: true } },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
              ],
            },
          },
          {
            $addFields: { latestVideo: { $first: "$videos" } },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              latestVideo: {
                _id: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
              },
            },
          },
        ],
      },
    },
    { $unwind: "$subscribedChannel" },
    { $project: { _id: 0, subscribedChannel: 1 } },
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    )
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }