import mongoose from "mongoose"
import dotenv from "dotenv"
import { v2 as cloudinary } from "cloudinary"

dotenv.config({ path: "./.env" })

import { User } from "./src/models/user.model.js"
import { Video } from "./src/models/video.model.js"
import { Tweet } from "./src/models/tweet.model.js"
import { Subscription } from "./src/models/subscription.model.js"
import { Like } from "./src/models/like.model.js"
import { Comment } from "./src/models/comment.model.js"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const DB_NAME = "videotube"

// ── Public video URLs ──────────────────────────────────────────────────────
const publicVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
]

// ── Users ──────────────────────────────────────────────────────────────────
const users = [
  {
    fullName: "Alex Johnson",
    username: "alexj",
    email: "alex@vidstream.com",
    password: "Alex@1234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  },
  {
    fullName: "Priya Sharma",
    username: "priyasharma",
    email: "priya@vidstream.com",
    password: "Priya@1234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
  },
  {
    fullName: "Marcus Williams",
    username: "marcusw",
    email: "marcus@vidstream.com",
    password: "Marcus@1234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
  },
  {
    fullName: "Sofia Chen",
    username: "sofiac",
    email: "sofia@vidstream.com",
    password: "Sofia@1234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
  },
  {
    fullName: "James Carter",
    username: "jamesc",
    email: "james@vidstream.com",
    password: "James@1234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
  },
]

// ── Videos ─────────────────────────────────────────────────────────────────
const videoData = [
  // Alex
  {
    userIndex: 0,
    title: "Getting Started with React in 2024",
    description: "In this video I walk you through setting up a React project from scratch using Vite. We cover components, props, state, and hooks. Perfect for beginners who want to learn modern React development.\n\n00:00 Introduction\n02:30 Setting up Vite\n05:00 Creating components\n10:00 Using hooks",
    videoUrl: publicVideos[0],
    thumbnailUrl: "https://picsum.photos/seed/react2024/640/360",
    duration: 720,
    views: 15420,
  },
  {
    userIndex: 0,
    title: "Node.js REST API Tutorial — Build from Scratch",
    description: "Building a complete REST API with Node.js and Express. We cover routing, middleware, error handling, and connecting to MongoDB. By the end you will have a production ready API.\n\n00:00 Intro\n03:00 Setting up Express\n08:00 Creating routes\n15:00 MongoDB connection",
    videoUrl: publicVideos[1],
    thumbnailUrl: "https://picsum.photos/seed/nodejs/640/360",
    duration: 1840,
    views: 28900,
  },
  {
    userIndex: 0,
    title: "JavaScript Async/Await Explained Simply",
    description: "Async/Await is one of the most important concepts in modern JavaScript. In this video I break it down with real world examples so you never get confused again.\n\nTopics covered:\n- Promises vs Async/Await\n- Error handling with try/catch\n- Parallel requests with Promise.all",
    videoUrl: publicVideos[2],
    thumbnailUrl: "https://picsum.photos/seed/asyncawait/640/360",
    duration: 960,
    views: 42100,
  },
  // Priya
  {
    userIndex: 1,
    title: "Figma for Beginners — Complete UI Design Course",
    description: "Learn Figma from scratch in this comprehensive tutorial. We go from the very basics all the way to building a complete mobile app design. Great for anyone wanting to get into UI/UX design.\n\n- Setting up Figma\n- Frames and components\n- Auto layout\n- Prototyping",
    videoUrl: publicVideos[3],
    thumbnailUrl: "https://picsum.photos/seed/figma/640/360",
    duration: 2400,
    views: 67800,
  },
  {
    userIndex: 1,
    title: "CSS Grid vs Flexbox — When to Use Which",
    description: "One of the most common questions in web development. I break down exactly when to use CSS Grid and when to use Flexbox with practical real world examples and layouts.\n\nAfter this video you will never second guess yourself again when building layouts.",
    videoUrl: publicVideos[4],
    thumbnailUrl: "https://picsum.photos/seed/cssgrid/640/360",
    duration: 1080,
    views: 31500,
  },
  {
    userIndex: 1,
    title: "Building a Portfolio Website — Full Tutorial",
    description: "Step by step tutorial to build a stunning portfolio website using HTML, CSS, and a little JavaScript. No frameworks needed. We focus on clean design and smooth animations that will impress any potential employer.",
    videoUrl: publicVideos[5],
    thumbnailUrl: "https://picsum.photos/seed/portfolio/640/360",
    duration: 3600,
    views: 89200,
  },
  // Marcus
  {
    userIndex: 2,
    title: "MongoDB Aggregation Pipeline — Deep Dive",
    description: "The aggregation pipeline is one of the most powerful features in MongoDB. In this video we go deep into $match, $group, $lookup, $project, and more with real examples from a production app.\n\nThis is the video I wish I had when I was learning MongoDB.",
    videoUrl: publicVideos[6],
    thumbnailUrl: "https://picsum.photos/seed/mongodb/640/360",
    duration: 2160,
    views: 19800,
  },
  {
    userIndex: 2,
    title: "Docker for Developers — Zero to Hero",
    description: "Everything you need to know about Docker as a developer. We cover containers, images, volumes, networking, and Docker Compose. By the end you will be able to containerize any application.\n\n- What is Docker?\n- Building images\n- Docker Compose\n- Deploying containers",
    videoUrl: publicVideos[7],
    thumbnailUrl: "https://picsum.photos/seed/docker/640/360",
    duration: 2880,
    views: 54300,
  },
  {
    userIndex: 2,
    title: "TypeScript Tutorial — From JavaScript to TypeScript",
    description: "Ready to upgrade your JavaScript skills? This tutorial walks you through TypeScript from the very basics. Learn types, interfaces, generics, and how to set up TypeScript in your existing projects.",
    videoUrl: publicVideos[8],
    thumbnailUrl: "https://picsum.photos/seed/typescript/640/360",
    duration: 1920,
    views: 37600,
  },
  // Sofia
  {
    userIndex: 3,
    title: "Machine Learning with Python — Beginner Guide",
    description: "Starting your machine learning journey? This video covers everything you need to get started with Python and ML. We build real models using scikit-learn and visualize results with matplotlib.\n\n- Linear regression\n- Classification\n- Model evaluation\n- Overfitting",
    videoUrl: publicVideos[9],
    thumbnailUrl: "https://picsum.photos/seed/machinelearning/640/360",
    duration: 3240,
    views: 112000,
  },
  {
    userIndex: 3,
    title: "How ChatGPT Actually Works — Explained Simply",
    description: "Everyone uses ChatGPT but how does it actually work? In this video I break down large language models, transformers, and how OpenAI trained ChatGPT in a way that anyone can understand. No PhD required.",
    videoUrl: publicVideos[10],
    thumbnailUrl: "https://picsum.photos/seed/chatgpt/640/360",
    duration: 1440,
    views: 245000,
  },
  {
    userIndex: 3,
    title: "Python Pandas Tutorial — Data Analysis for Beginners",
    description: "Learn how to analyze data with Python and Pandas. We cover DataFrames, filtering, grouping, merging, and visualization. By the end you will be able to handle real world datasets with confidence.",
    videoUrl: publicVideos[11],
    thumbnailUrl: "https://picsum.photos/seed/pandas/640/360",
    duration: 2520,
    views: 78400,
  },
  // James
  {
    userIndex: 4,
    title: "AWS for Beginners — Core Services Explained",
    description: "AWS can be overwhelming for beginners. In this video I cut through the noise and explain the core services you actually need — EC2, S3, RDS, Lambda, and more. With real demos and no fluff.\n\nPerfect if you are preparing for AWS certification.",
    videoUrl: publicVideos[12],
    thumbnailUrl: "https://picsum.photos/seed/aws/640/360",
    duration: 3600,
    views: 93100,
  },
  {
    userIndex: 4,
    title: "CI/CD Pipeline with GitHub Actions — Full Tutorial",
    description: "Set up a complete CI/CD pipeline using GitHub Actions. We cover automated testing, building Docker images, and deploying to production. A must watch for any modern developer.\n\n- GitHub Actions basics\n- Writing workflows\n- Secrets management\n- Deploy on push",
    videoUrl: publicVideos[13],
    thumbnailUrl: "https://picsum.photos/seed/cicd/640/360",
    duration: 2160,
    views: 41200,
  },
  {
    userIndex: 4,
    title: "Linux Command Line for Developers — Crash Course",
    description: "Every developer needs to know the Linux command line. This crash course covers everything from basic navigation to writing shell scripts. Stop being scared of the terminal and start being productive.",
    videoUrl: publicVideos[14],
    thumbnailUrl: "https://picsum.photos/seed/linux/640/360",
    duration: 1680,
    views: 62700,
  },
]

// ── Tweets ─────────────────────────────────────────────────────────────────
const tweetData = [
  { userIndex: 0, content: "Just shipped a new React project using Vite and TypeScript. The developer experience is absolutely incredible. No more slow builds!" },
  { userIndex: 0, content: "Hot take: Every backend developer should spend at least a week doing frontend work. It completely changes how you think about APIs and data." },
  { userIndex: 0, content: "Working on a new tutorial about React Server Components. It is one of those concepts that finally clicked for me this week. Video dropping soon!" },
  { userIndex: 1, content: "Design tip: White space is not empty space. It is breathing room. Stop filling every pixel and let your designs breathe." },
  { userIndex: 1, content: "Just finished redesigning my entire portfolio from scratch. Dark mode, smooth animations, mobile first. Really happy with how it turned out." },
  { userIndex: 1, content: "Figma's Dev Mode is an absolute game changer for designer and developer collaboration. We no longer have to play the guessing game with specs." },
  { userIndex: 2, content: "MongoDB's aggregation pipeline is basically SQL but cooler. Once you understand it you will never want to go back to raw queries again." },
  { userIndex: 2, content: "TypeScript saved me from 3 production bugs this week alone. The initial setup time pays for itself within the first few days. Just use it." },
  { userIndex: 2, content: "Docker tip: Always use multi-stage builds for production images. I went from 1.2GB to 180MB on my Node.js app just by doing this one thing." },
  { userIndex: 3, content: "The AI space is not slowing down. If anything we are still in the early innings. The real applications have not been built yet. Exciting times." },
  { userIndex: 3, content: "Spent the weekend reading the Attention Is All You Need paper again. Still find something new every time. The transformer architecture is genuinely beautiful." },
  { userIndex: 3, content: "Python tip: Use vectorized operations with NumPy instead of loops. I sped up a data processing script from 45 seconds to 0.3 seconds today." },
  { userIndex: 4, content: "Your CI/CD pipeline is not optional. It is not a nice to have. It is the foundation of shipping software confidently. Automate everything you can." },
  { userIndex: 4, content: "AWS cost tip: Set up billing alerts on day one. I have seen startups burn through thousands because they forgot to turn off a GPU instance." },
  { userIndex: 4, content: "Linux is not scary. It is the most powerful tool in a developer's arsenal. Learn 20 commands and you will feel like a wizard every single day." },
]

// ── Comments ───────────────────────────────────────────────────────────────
const commentData = [
  { videoIndex: 0, userIndex: 1, content: "This is exactly what I needed! Clear explanation and great examples throughout." },
  { videoIndex: 0, userIndex: 2, content: "Finally a React tutorial that does not waste time. Subscribed immediately!" },
  { videoIndex: 0, userIndex: 3, content: "The Vite setup part was super helpful. Thanks Alex!" },
  { videoIndex: 1, userIndex: 4, content: "Best Node.js tutorial I have seen this year. Very well structured." },
  { videoIndex: 1, userIndex: 3, content: "The MongoDB connection section at 15 minutes is pure gold. Bookmarked." },
  { videoIndex: 2, userIndex: 1, content: "Promise.all explanation was what I was missing. Makes so much sense now." },
  { videoIndex: 3, userIndex: 0, content: "Priya your design breakdowns are always so clean. Love the content." },
  { videoIndex: 3, userIndex: 2, content: "As a developer this helped me understand what designers actually need from us." },
  { videoIndex: 4, userIndex: 4, content: "I always mixed up Grid and Flexbox. Not anymore after watching this video." },
  { videoIndex: 6, userIndex: 0, content: "The lookup explanation finally made aggregation click for me. Thank you Marcus!" },
  { videoIndex: 6, userIndex: 3, content: "Aggregation pipelines are so powerful once you understand them. Great deep dive." },
  { videoIndex: 7, userIndex: 1, content: "Docker Compose section was exactly what my team needed. Sharing this with everyone." },
  { videoIndex: 9, userIndex: 0, content: "Sofia you have a gift for making complex topics feel simple and approachable." },
  { videoIndex: 9, userIndex: 2, content: "Started learning ML because of this video. Currently building my first model!" },
  { videoIndex: 10, userIndex: 1, content: "The transformer explanation was mind blowing. Best video on this topic on the internet." },
  { videoIndex: 11, userIndex: 4, content: "Pandas always felt intimidating. This tutorial changed that completely." },
  { videoIndex: 12, userIndex: 1, content: "Been putting off learning AWS for months. This video finally got me started." },
  { videoIndex: 12, userIndex: 3, content: "The billing alerts tip alone was worth watching this entire video. Thanks James!" },
  { videoIndex: 13, userIndex: 2, content: "Set up my first GitHub Actions pipeline after watching this. Worked first try!" },
  { videoIndex: 14, userIndex: 0, content: "I was scared of the terminal for years. Not anymore. Watched this three times already." },
]

// ── Subscriptions ──────────────────────────────────────────────────────────
const subscriptionPairs = [
  [0, 3], // alex → sofia
  [0, 4], // alex → james
  [1, 0], // priya → alex
  [1, 3], // priya → sofia
  [2, 3], // marcus → sofia
  [2, 4], // marcus → james
  [3, 0], // sofia → alex
  [3, 1], // sofia → priya
  [4, 0], // james → alex
  [4, 2], // james → marcus
]

// ── Main seed function ─────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log("✅ Connected to MongoDB\n")

    // ── Clear old seed data ──
    console.log("🗑️  Clearing old seed data...")
    const seedEmails = users.map(u => u.email)
    const oldUsers = await User.find({ email: { $in: seedEmails } })
    const oldUserIds = oldUsers.map(u => u._id)

    if (oldUserIds.length > 0) {
      await Video.deleteMany({ owner: { $in: oldUserIds } })
      await Tweet.deleteMany({ owner: { $in: oldUserIds } })
      await Comment.deleteMany({ owner: { $in: oldUserIds } })
      await Subscription.deleteMany({
        $or: [
          { subscriber: { $in: oldUserIds } },
          { channel: { $in: oldUserIds } },
        ]
      })
      await Like.deleteMany({ likedBy: { $in: oldUserIds } })
      await User.deleteMany({ email: { $in: seedEmails } })
      console.log("   Cleared previous seed users and their data\n")
    } else {
      console.log("   No previous seed data found\n")
    }

    // ── Create users ──
    console.log("👤 Creating users...")
    const createdUsers = []

    for (const userData of users) {
      // try cloudinary avatar upload, fallback to ui-avatars
      let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=00c853&color=fff&size=200&bold=true`

      try {
        const avatarUpload = await cloudinary.uploader.upload(
          userData.avatarUrl,
          { resource_type: "image", folder: "vidstream/avatars" }
        )
        avatarUrl = avatarUpload.secure_url
        console.log(`   ☁️  Cloudinary avatar uploaded for @${userData.username}`)
      } catch {
        console.log(`   ⚠️  Cloudinary failed for @${userData.username} — using fallback avatar`)
      }

      // use new User + save so the pre-save hook hashes the password correctly
      const user = new User({
        fullName: userData.fullName,
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password: userData.password,  // plain text — model will hash it once
        avatar: avatarUrl,
        coverImage: "",
      })

      await user.save()
      createdUsers.push(user)
      console.log(`   ✅ @${user.username} — ${user.fullName}`)
    }

    // ── Create videos ──
    console.log("\n🎬 Creating videos...")
    const createdVideos = []

    for (let i = 0; i < videoData.length; i++) {
      const v = videoData[i]

      let thumbnailUrl = v.thumbnailUrl
      try {
        const thumbUpload = await cloudinary.uploader.upload(
          v.thumbnailUrl,
          { resource_type: "image", folder: "vidstream/thumbnails" }
        )
        thumbnailUrl = thumbUpload.secure_url
      } catch {
        console.log(`   ⚠️  Thumbnail upload failed for video ${i + 1} — using picsum`)
      }

      const video = await Video.create({
        title: v.title,
        description: v.description,
        videoFile: v.videoUrl,
        thumbnail: thumbnailUrl,
        duration: v.duration,
        views: v.views,
        isPublished: true,
        owner: createdUsers[v.userIndex]._id,
      })

      createdVideos.push(video)
      console.log(`   ✅ [${i + 1}/15] "${v.title.substring(0, 42)}..."`)
    }

    // ── Create tweets ──
    console.log("\n✦ Creating tweets...")

    for (const t of tweetData) {
      await Tweet.create({
        content: t.content,
        owner: createdUsers[t.userIndex]._id,
      })
      console.log(`   ✅ @${users[t.userIndex].username}: "${t.content.substring(0, 42)}..."`)
    }

    // ── Create comments ──
    console.log("\n💬 Creating comments...")

    for (const c of commentData) {
      await Comment.create({
        content: c.content,
        video: createdVideos[c.videoIndex]._id,
        owner: createdUsers[c.userIndex]._id,
      })
    }
    console.log(`   ✅ ${commentData.length} comments added`)

    // ── Create subscriptions ──
    console.log("\n◉ Creating subscriptions...")

    for (const [subIdx, chanIdx] of subscriptionPairs) {
      await Subscription.create({
        subscriber: createdUsers[subIdx]._id,
        channel: createdUsers[chanIdx]._id,
      })
      console.log(`   ✅ @${users[subIdx].username} → @${users[chanIdx].username}`)
    }

    // ── Add likes (every user likes every other user's videos) ──
    console.log("\n♥ Adding likes...")

    for (let i = 0; i < createdVideos.length; i++) {
      for (let j = 0; j < createdUsers.length; j++) {
        if (
          createdVideos[i].owner.toString() !==
          createdUsers[j]._id.toString()
        ) {
          await Like.create({
            video: createdVideos[i]._id,
            likedBy: createdUsers[j]._id,
          })
        }
      }
    }
    console.log(`   ✅ Every video liked by all other users`)

    // ── Add watch history ──
    console.log("\n👁 Adding watch history...")

    for (let i = 0; i < createdUsers.length; i++) {
      const watchList = createdVideos
        .filter(v => v.owner.toString() !== createdUsers[i]._id.toString())
        .slice(0, 8)
        .map(v => v._id)

      await User.findByIdAndUpdate(createdUsers[i]._id, {
        $addToSet: { watchHistory: { $each: watchList } }
      })
    }
    console.log(`   ✅ Watch history added for all users`)

    // ── Done ──
    console.log("\n" + "═".repeat(58))
    console.log("🎉  SEED COMPLETE — DATABASE IS READY FOR INTERVIEW!")
    console.log("═".repeat(58))

    console.log("\n📋  LOGIN CREDENTIALS:\n")
    const topics = [
      "React & Node.js",
      "UI/UX Design",
      "Full Stack & DevOps",
      "AI & Data Science",
      "Cloud & DevOps",
    ]
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.fullName} (${topics[i]})`)
      console.log(`     Email:    ${u.email}`)
      console.log(`     Password: ${u.password}`)
      console.log(`     Username: @${u.username}`)
      console.log()
    })

    console.log("📊  CREATED:")
    console.log(`     ${createdUsers.length}  users`)
    console.log(`     ${createdVideos.length} videos  (3 per user, all playable)`)
    console.log(`     ${tweetData.length} tweets  (3 per user)`)
    console.log(`     ${commentData.length} comments (on various videos)`)
    console.log(`     ${subscriptionPairs.length} subscriptions`)
    console.log(`     likes on every video from every other user`)
    console.log(`     watch history for every user`)

    console.log("\n🎬  DEMO VIDEO FOR UPLOAD FEATURE:")
    console.log("     Download before your interview and save to Desktop:")
    console.log("     https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4\n")

    process.exit(0)
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message)
    console.error(err)
    process.exit(1)
  }
}

seed()