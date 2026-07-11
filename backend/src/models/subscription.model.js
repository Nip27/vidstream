import mongoose, { Schema } from "mongoose"

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // the user who is subscribing
      ref: "User",
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId, // the user being subscribed to
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// ── Unique compound index — prevents duplicate subscriptions at DB level ───────
// Also makes subscriber→channel and channel→subscriber lookups O(log n)
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true })
subscriptionSchema.index({ channel: 1 }) // for counting subscribers

export const Subscription = mongoose.model("Subscription", subscriptionSchema)