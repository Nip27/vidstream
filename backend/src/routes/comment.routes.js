import { Router } from "express"
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// GET comments is public (with optional auth for isLiked)
router.route("/:videoId").get(optionalVerifyJWT, getVideoComments)

// All write operations require auth
router.route("/:videoId").post(verifyJWT, addComment)
router.route("/c/:commentId").delete(verifyJWT, deleteComment).patch(verifyJWT, updateComment)

export default router