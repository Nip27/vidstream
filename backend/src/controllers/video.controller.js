import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const ALLOWED_VIDEO_URL_REGEX = /^https?:\/\/.+/i

// ─────────────────────────────────────────────
// GET ALL VIDEOS (public with optional auth)
// ─────────────────────────────────────────────
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

  const pipeline = []

  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          { description: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        ],
      },
    })
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")
    pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } })
  }

  // Only show published videos to the public
  pipeline.push({ $match: { isPublished: true } })

  // Sorting
  if (query) {
    pipeline.push(
      {
        $addFields: {
          titleMatch: { $indexOfCP: [{ $toLower: "$title" }, query.toLowerCase()] },
        },
      },
      { $sort: { titleMatch: 1, createdAt: -1 } }
    )
  } else if (sortBy && sortType) {
    pipeline.push({ $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } })
  } else {
    pipeline.push({ $sort: { createdAt: -1 } })
  }

  // Join owner
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$ownerDetails" }
  )

  const videoAggregate = Video.aggregate(pipeline)

  const options = {
    page: Math.max(parseInt(page, 10), 1),
    limit: Math.min(parseInt(limit, 10), 50), // cap at 50 per page
  }

  const video = await Video.aggregatePaginate(videoAggregate, options)

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"))
})

// ─────────────────────────────────────────────
// PUBLISH A VIDEO (file upload)
// ─────────────────────────────────────────────
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required")
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

  if (!videoFileLocalPath) throw new ApiError(400, "Video file is required")
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required")

  const [videoFile, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoFileLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ])

  if (!videoFile) throw new ApiError(500, "Video upload failed — please try again")
  if (!thumbnail) throw new ApiError(500, "Thumbnail upload failed — please try again")

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: videoFile.duration || 0,
    owner: req.user._id,
    isPublished: true,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"))
})

// ─────────────────────────────────────────────
// PUBLISH VIDEO FROM URL
// ─────────────────────────────────────────────
const publishVideoFromUrl = asyncHandler(async (req, res) => {
  const { title, description, videoUrl, duration } = req.body

  if (!title?.trim()) throw new ApiError(400, "Title is required")
  if (!videoUrl?.trim()) throw new ApiError(400, "Video URL is required")

  // Validate URL format and scheme
  if (!ALLOWED_VIDEO_URL_REGEX.test(videoUrl)) {
    throw new ApiError(400, "Video URL must be a valid http/https URL")
  }

  let thumbnailUrl = `https://picsum.photos/seed/${Date.now()}/640/360`

  const thumbnailLocalPath = req.file?.path
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (thumbnail) thumbnailUrl = thumbnail.url
  }

  const parsedDuration = parseInt(duration, 10)
  if (isNaN(parsedDuration) || parsedDuration < 0) {
    throw new ApiError(400, "Duration must be a non-negative integer (seconds)")
  }

  const video = await Video.create({
    videoFile: videoUrl,
    thumbnail: thumbnailUrl,
    title: title.trim(),
    description: description?.trim() || "",
    duration: parsedDuration,
    owner: req.user._id,
    isPublished: true,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video added successfully"))
})

// ─────────────────────────────────────────────
// GET VIDEO BY ID (public with optional auth)
// ─────────────────────────────────────────────
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId")
  }

  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id ?? null, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $first: "$owner" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id ?? null, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        thumbnail: 1,
        isPublished: 1,
      },
    },
  ])

  if (!video?.length) {
    throw new ApiError(404, "Video not found")
  }

  if (!video[0].isPublished) {
    // Only owner can see unpublished videos
    if (!req.user || video[0].owner?._id?.toString() !== req.user._id?.toString()) {
      throw new ApiError(404, "Video not found")
    }
  }

  // Increment views and update watch history (fire-and-forget)
  Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).catch(() => {})

  if (req.user) {
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: videoId },
    }).catch(() => {})
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})

// ─────────────────────────────────────────────
// UPDATE VIDEO
// ─────────────────────────────────────────────
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

  if (!title?.trim() && !description?.trim()) {
    throw new ApiError(400, "At least one of title or description is required")
  }

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video not found")

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — you are not the owner of this video")
  }

  const updateData = {}
  if (title?.trim()) updateData.title = title.trim()
  if (description?.trim()) updateData.description = description.trim()

  if (req.file?.path) {
    const oldThumbnail = video.thumbnail
    const thumbnail = await uploadOnCloudinary(req.file.path)
    if (!thumbnail) throw new ApiError(500, "Thumbnail upload failed")
    updateData.thumbnail = thumbnail.url
    // Clean up old thumbnail
    if (oldThumbnail) await deleteFromCloudinary(oldThumbnail)
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

// ─────────────────────────────────────────────
// DELETE VIDEO
// ─────────────────────────────────────────────
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video not found")

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — you are not the owner of this video")
  }

  await Video.findByIdAndDelete(videoId)

  // Clean up Cloudinary assets (fire-and-forget — don't block response)
  deleteFromCloudinary(video.videoFile, "video").catch(() => {})
  deleteFromCloudinary(video.thumbnail).catch(() => {})

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

// ─────────────────────────────────────────────
// TOGGLE PUBLISH STATUS
// ─────────────────────────────────────────────
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "Video not found")

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — you are not the owner of this video")
  }

  const toggled = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  )

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: toggled.isPublished },
        `Video ${toggled.isPublished ? "published" : "unpublished"} successfully`
      )
    )
})

export {
  getAllVideos,
  publishAVideo,
  publishVideoFromUrl,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
}