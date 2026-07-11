import mongoose, { Schema } from "mongoose"

const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// ── Compound indexes — dramatically speed up like-toggle lookups ──────────────
likeSchema.index({ video: 1, likedBy: 1 })
likeSchema.index({ comment: 1, likedBy: 1 })
likeSchema.index({ tweet: 1, likedBy: 1 })
likeSchema.index({ likedBy: 1 }) // for getLikedVideos

export const Like = mongoose.model("Like", likeSchema)