import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config({ path: "./.env" })

import { User } from "./src/models/user.model.js"
import { Video } from "./src/models/video.model.js"
import { Tweet } from "./src/models/tweet.model.js"
import { Subscription } from "./src/models/subscription.model.js"
import { Like } from "./src/models/like.model.js"
import { Comment } from "./src/models/comment.model.js"
import { Playlist } from "./src/models/playlist.model.js"

const DB_NAME = "videotube"

const cleanDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log("✅ Connected to MongoDB\n")

    console.log("🗑️  Deleting all collections...\n")

    const users = await User.deleteMany({})
    console.log(`   ✅ Users deleted:         ${users.deletedCount}`)

    const videos = await Video.deleteMany({})
    console.log(`   ✅ Videos deleted:        ${videos.deletedCount}`)

    const tweets = await Tweet.deleteMany({})
    console.log(`   ✅ Tweets deleted:        ${tweets.deletedCount}`)

    const comments = await Comment.deleteMany({})
    console.log(`   ✅ Comments deleted:      ${comments.deletedCount}`)

    const likes = await Like.deleteMany({})
    console.log(`   ✅ Likes deleted:         ${likes.deletedCount}`)

    const subs = await Subscription.deleteMany({})
    console.log(`   ✅ Subscriptions deleted: ${subs.deletedCount}`)

    const playlists = await Playlist.deleteMany({})
    console.log(`   ✅ Playlists deleted:     ${playlists.deletedCount}`)

    console.log("\n" + "═".repeat(40))
    console.log("🎉  DATABASE CLEANED SUCCESSFULLY!")
    console.log("═".repeat(40))
    console.log("\nRun seed now:")
    console.log("node -r dotenv/config seed.js\n")

    process.exit(0)
  } catch (err) {
    console.error("❌ Clean failed:", err.message)
    process.exit(1)
  }
}

cleanDB()