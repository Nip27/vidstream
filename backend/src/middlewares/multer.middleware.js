import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import { ApiError } from "../utils/ApiError.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure temp directory exists at startup
const tempDir = path.join(__dirname, "../../public/temp")
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
])

// ── Storage: safe UUID filenames prevent path traversal & collisions ──────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

// ── File type filter ──────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const isImage = ALLOWED_IMAGE_TYPES.has(file.mimetype)
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.mimetype)

  if (isImage || isVideo) {
    cb(null, true)
  } else {
    cb(
      new ApiError(
        415,
        `Unsupported file type: ${file.mimetype}. Allowed: images (jpeg, png, webp, gif) and videos (mp4, webm, ogg, mov, avi).`
      ),
      false
    )
  }
}

// ── Size limits ───────────────────────────────────────────────────────────────
// Images: 5 MB | Videos: 200 MB
const FIVE_MB = 5 * 1024 * 1024
const TWO_HUNDRED_MB = 200 * 1024 * 1024

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: TWO_HUNDRED_MB, // multer enforces single limit; we fine-check below
    files: 2,
  },
})

/**
 * Additional per-field size enforcement middleware.
 * Call after multer's upload middleware to enforce tighter image limits.
 */
export const enforceImageSizeLimit = (req, _res, next) => {
  const imageFields = ["avatar", "coverImage", "thumbnail"]

  for (const field of imageFields) {
    const files = req.files?.[field] || (req.file?.fieldname === field ? [req.file] : [])
    for (const f of files) {
      if (f.size > FIVE_MB) {
        // Delete the oversized temp file
        try { fs.unlinkSync(f.path) } catch {}
        return next(
          new ApiError(413, `${field} must be under 5 MB`)
        )
      }
    }
  }

  next()
}