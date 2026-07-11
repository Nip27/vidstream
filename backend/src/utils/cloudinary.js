import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import logger from "./logger.js"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload a local file to Cloudinary.
 * Always deletes the local temp file after upload (success or failure).
 * Returns the Cloudinary response object, or null on failure.
 */
const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    })
    logger.info(`Cloudinary upload success: ${response.secure_url}`)
    return response
  } catch (error) {
    logger.error("Cloudinary upload failed:", error.message)
    return null
  } finally {
    // Always clean up the temp file, regardless of upload result
    try {
      fs.unlinkSync(localFilePath)
    } catch {
      // File may have already been removed — safe to ignore
    }
  }
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * Extracts the public_id from a Cloudinary URL if a full URL is passed.
 * Returns the deletion result, or null on failure.
 */
const deleteFromCloudinary = async (publicIdOrUrl, resourceType = "image") => {
  if (!publicIdOrUrl) return null

  try {
    // If a full URL is passed, extract just the public_id
    let publicId = publicIdOrUrl
    if (publicIdOrUrl.startsWith("http")) {
      const urlParts = publicIdOrUrl.split("/")
      const fileWithExt = urlParts[urlParts.length - 1]
      publicId = fileWithExt.split(".")[0]
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    logger.info(`Cloudinary delete: ${publicId} — ${result.result}`)
    return result
  } catch (error) {
    logger.error("Cloudinary delete failed:", error.message)
    return null
  }
}

export { uploadOnCloudinary, deleteFromCloudinary }