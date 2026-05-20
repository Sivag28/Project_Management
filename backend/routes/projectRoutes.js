import express from "express";

import { getProjects, createProject, getAllProjects, deleteProject, getProjectById } from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";



const router = express.Router();

router.get("/", protect, getProjects);

router.post("/", protect, createProject);

router.get("/all", protect, getAllProjects);

router.get("/:id", protect, getProjectById);

router.delete("/:id", protect, deleteProject);

export default router;
