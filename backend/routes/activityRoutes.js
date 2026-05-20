import express from "express";
import { getActivityLogs } from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:projectId", protect, getActivityLogs);
router.get("/all", protect, getActivityLogs);

export default router;
