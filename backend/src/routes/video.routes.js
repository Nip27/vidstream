import { Router } from "express"
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  publishVideoFromUrl,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js"
import { upload, enforceImageSizeLimit } from "../middlewares/multer.middleware.js"

const router = Router()

// ── Public routes (auth optional — enriches isLiked/isSubscribed for logged-in users) ──
router.route("/").get(optionalVerifyJWT, getAllVideos)
router.route("/:videoId").get(optionalVerifyJWT, getVideoById)

// ── Protected routes ──────────────────────────────────────────────────────────
router
  .route("/")
  .post(
    verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    enforceImageSizeLimit,
    publishAVideo
  )

router
  .route("/url")
  .post(
    verifyJWT,
    upload.single("thumbnail"),
    enforceImageSizeLimit,
    publishVideoFromUrl
  )

router
  .route("/:videoId")
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, upload.single("thumbnail"), enforceImageSizeLimit, updateVideo)

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus)

export default router