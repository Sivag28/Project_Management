import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { managerOnly } from "../middleware/roleMiddleware.js";

const getCompanyId = (user) => user?.company?._id || user?.company;

export const createProject = async (req, res) => {
  const companyId = getCompanyId(req.user);
  if (!companyId) {
    return res.status(400).json({ message: "User company is required" });
  }

  const project = await Project.create({
    ...req.body,
    owner: req.user._id,
    company: companyId,
    members: req.body.assignedMembers ? [req.user._id, ...req.body.assignedMembers] : [req.user._id]
  });
  res.json(project);
};

export const deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (project.owner.toString() !== req.user._id.toString() && req.user.role.name !== "Admin") {
    return res.status(403).json({ message: "Only project owner or admin can delete the project" });
  }

  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: "Project deleted successfully" });
};

export const getProjects = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    console.log("getProjects called for user:", req.user._id, "company:", companyId);
    console.log("User role:", req.user.role.name);

    const allCompanyProjects = await Project.find({
      company: companyId
    }).populate("owner members company", "name email");

    console.log("getProjects - ALL company projects for user:", req.user.name, allCompanyProjects.length);
    res.json(allCompanyProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    console.log("getAllProjects called for user:", req.user._id, "role:", req.user.role.name);
    let projects;

    if (req.user.role.name === "Manager" || req.user.role.name === "Admin") {
      projects = await Project.find({
        company: companyId
      }).populate("owner members company", "name email");
      console.log("Manager/Admin - ALL company projects:", projects.length);
      return res.json(projects);
    }

    projects = await Project.find({
      company: companyId
    }).populate("owner members company", "name email");

    const userProjects = projects.filter(
      (p) =>
        p.owner._id.toString() === req.user._id.toString() ||
        p.members.some((m) => m._id.toString() === req.user._id.toString())
    );

    console.log("User (member/owner) projects count:", userProjects.length);
    res.json(userProjects);
  } catch (error) {
    console.error("Error fetching all projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id).populate("owner members company", "name email");
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (
    !project.members.some((m) => m._id.toString() === req.user._id.toString()) &&
    project.owner.toString() !== req.user._id.toString() &&
    req.user.role.name !== "Admin"
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(project);
};
