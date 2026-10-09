import express from "express";

import { getProjects, createProject, getAllProjects, deleteProject, getProjectById, updateProjectDeadline } from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";
import { managerOnly } from "../middleware/roleMiddleware.js";



const router = express.Router();

router.get("/", protect, getProjects);

router.post("/", protect, managerOnly, createProject);

router.get("/all", protect, getAllProjects);

router.get("/:id", protect, getProjectById);

router.put("/:id/deadline", protect, managerOnly, updateProjectDeadline);

router.delete("/:id", protect, deleteProject);

export default router;
