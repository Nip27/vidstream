import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import logger from "../utils/logger.js"

const connectDB = async () => {
  const uri = `${process.env.MONGODB_URI}/${DB_NAME}`

  const connectionInstance = await mongoose.connect(uri)

  logger.info(
    `MongoDB connected — host: ${connectionInstance.connection.host}, db: ${connectionInstance.connection.name}`
  )

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err.message)
  })

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected")
  })
}

export default connectDB