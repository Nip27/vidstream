import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ─────────────────────────────────────────────
// CREATE PLAYLIST
// ─────────────────────────────────────────────
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (!name?.trim()) throw new ApiError(400, "Playlist name is required")
  if (!description?.trim()) throw new ApiError(400, "Playlist description is required")

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

// ─────────────────────────────────────────────
// GET USER PLAYLISTS
// ─────────────────────────────────────────────
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")

  const playlists = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

// ─────────────────────────────────────────────
// GET PLAYLIST BY ID
// ─────────────────────────────────────────────
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlistId")

  // BUG FIX: The previous code used $match: { "videos.isPublished": true } after
  // $lookup, which drops the entire playlist if any video is unpublished.
  // Correct approach: filter published videos inside the videos array using $filter.
  const playlists = await Playlist.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        // Filter to only published videos
        videos: {
          $filter: {
            input: "$videos",
            as: "v",
            cond: { $eq: ["$$v.isPublished", true] },
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        owner: 1,
        videos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
      },
    },
  ])

  if (!playlists?.length) throw new ApiError(404, "Playlist not found")

  return res
    .status(200)
    .json(new ApiResponse(200, playlists[0], "Playlist fetched successfully"))
})

// ─────────────────────────────────────────────
// ADD VIDEO TO PLAYLIST
// ─────────────────────────────────────────────
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId")
  }

  const [playlist, video] = await Promise.all([
    Playlist.findById(playlistId),
    Video.findById(videoId),
  ])

  if (!playlist) throw new ApiError(404, "Playlist not found")
  if (!video) throw new ApiError(404, "Video not found")

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the playlist owner can add videos")
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Video added to playlist successfully"))
})

// ─────────────────────────────────────────────
// REMOVE VIDEO FROM PLAYLIST
// ─────────────────────────────────────────────
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId")
  }

  const playlist = await Playlist.findById(playlistId)
  if (!playlist) throw new ApiError(404, "Playlist not found")

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the playlist owner can remove videos")
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Video removed from playlist successfully"))
})

// ─────────────────────────────────────────────
// DELETE PLAYLIST
// ─────────────────────────────────────────────
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlistId")

  const playlist = await Playlist.findById(playlistId)
  if (!playlist) throw new ApiError(404, "Playlist not found")

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the playlist owner can delete it")
  }

  await Playlist.findByIdAndDelete(playlistId)

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

// ─────────────────────────────────────────────
// UPDATE PLAYLIST
// ─────────────────────────────────────────────
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body

  if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlistId")
  if (!name?.trim() && !description?.trim()) {
    throw new ApiError(400, "At least name or description is required")
  }

  const playlist = await Playlist.findById(playlistId)
  if (!playlist) throw new ApiError(404, "Playlist not found")

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the playlist owner can update it")
  }

  const updateData = {}
  if (name?.trim()) updateData.name = name.trim()
  if (description?.trim()) updateData.description = description.trim()

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updateData },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Playlist updated successfully"))
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
}