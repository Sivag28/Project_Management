import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProjectMessages,
  sendProjectMessage,
  getUnreadChatCount,
  markProjectMessagesAsRead
} from "../controllers/projectChatController.js";

const router = express.Router();

router.get("/unread-count", protect, getUnreadChatCount);
router.put("/:projectId/read", protect, markProjectMessagesAsRead);
router.route("/:projectId")
  .get(protect, getProjectMessages)
  .post(protect, sendProjectMessage);

export default router;
