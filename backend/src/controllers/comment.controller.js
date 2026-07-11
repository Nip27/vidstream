import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const MAX_COMMENT_LENGTH = 1000

// ─────────────────────────────────────────────
// GET ALL COMMENTS FOR A VIDEO
// ─────────────────────────────────────────────
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId")
  }

  const commentsAggregate = Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
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
    { $sort: { createdAt: -1 } },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: 1,
        isLiked: 1,
      },
    },
  ])

  const options = {
    page: Math.max(parseInt(page, 10), 1),
    limit: Math.min(parseInt(limit, 10), 50),
  }

  const comments = await Comment.aggregatePaginate(commentsAggregate, options)

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

// ─────────────────────────────────────────────
// ADD A COMMENT
// ─────────────────────────────────────────────
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { content } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId")
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required")
  }

  if (content.trim().length > MAX_COMMENT_LENGTH) {
    throw new ApiError(400, `Comment must be under ${MAX_COMMENT_LENGTH} characters`)
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"))
})

// ─────────────────────────────────────────────
// UPDATE A COMMENT
// ─────────────────────────────────────────────
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId")
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required")
  }

  if (content.trim().length > MAX_COMMENT_LENGTH) {
    throw new ApiError(400, `Comment must be under ${MAX_COMMENT_LENGTH} characters`)
  }

  const comment = await Comment.findById(commentId)
  if (!comment) throw new ApiError(404, "Comment not found")

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the comment owner can edit it")
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content: content.trim() } },
    { new: true }
  )

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

// ─────────────────────────────────────────────
// DELETE A COMMENT
// ─────────────────────────────────────────────
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId")
  }

  const comment = await Comment.findById(commentId)
  if (!comment) throw new ApiError(404, "Comment not found")

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden — only the comment owner can delete it")
  }

  await Comment.findByIdAndDelete(commentId)

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"))
})

export { getVideoComments, addComment, updateComment, deleteComment }