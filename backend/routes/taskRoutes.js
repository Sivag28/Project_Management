import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly, managerOnly } from "../middleware/roleMiddleware.js";
import { createTask, assignTask, updateTaskStatus, getTasks, getAllTasks, getTasksAssignedToUser, getMemberCompanyTasks } from "../controllers/taskController.js";

const router = express.Router();
router.post("/", protect, createTask);
router.put("/assign", protect, managerOnly, assignTask);

// 🔥 PUT STATIC ROUTES FIRST
router.get("/assigned", protect, getTasksAssignedToUser);
router.get("/member-company", protect, getMemberCompanyTasks);
router.get("/all", protect, getAllTasks);

// 🔥 DYNAMIC ROUTE LAST
router.get("/:projectId", protect, getTasks);

router.put("/:id/status", protect, updateTaskStatus);


export default router;
