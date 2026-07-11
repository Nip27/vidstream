import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"
import logger from "./utils/logger.js"

dotenv.config({ path: "./.env" })

const PORT = process.env.PORT || 8000

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })

    // ── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`)
      server.close(() => {
        logger.info("HTTP server closed")
        process.exit(0)
      })
      // Force-kill after 10 s if connections are stuck
      setTimeout(() => {
        logger.error("Forced shutdown after timeout")
        process.exit(1)
      }, 10_000)
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))

    server.on("error", (err) => {
      logger.error("Server error:", err.message)
      process.exit(1)
    })
  })
  .catch((err) => {
    logger.error("MongoDB connection failed:", err.message)
    process.exit(1)
  })