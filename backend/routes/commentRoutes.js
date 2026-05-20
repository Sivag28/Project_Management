import express from "express";
import { getComments, addComment } from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:taskId", protect, getComments);
router.post("/:taskId", protect, addComment);

export default router;
