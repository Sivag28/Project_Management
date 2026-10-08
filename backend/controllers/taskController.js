import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import mongoose from "mongoose";
import { notifyProjectParticipants } from "../utils/projectNotifications.js";

export const createTask = async (req, res) => {
  const companyId = req.user?.company?._id || req.user?.company;
  if (!companyId) {
    return res.status(400).json({ message: "User company is required" });
  }

  const task = await Task.create({
    ...req.body,
    company: companyId,
    assignedBy: req.body.assignedTo ? req.user._id : undefined,
  });
  await ActivityLog.create({ action: `Created task: ${task.title}`, user: req.user._id });
  await notifyProjectParticipants({
    companyId,
    actorId: req.user._id,
    projectId: task.projectId,
    taskId: task._id,
    message: `${req.user.name} created task "${task.title}"`,
    type: "task",
    io: req.app.get("io"),
  });
  const createdTask = await Task.findById(task._id)
    .populate({ path: "assignedTo", populate: { path: "role", select: "name" } })
    .populate("assignedBy", "name")
    .populate("projectId", "title");
  res.json(createdTask);
};

export const assignTask = async (req, res) => {
  const { taskId, userId } = req.body;
  const companyId = req.user?.company?._id || req.user?.company;
  if (!companyId) return res.status(400).json({ message: "User company is required" });

  const task = await Task.findOne({ _id: taskId, company: companyId }).populate('projectId');
  const user = await User.findOne({ _id: userId, company: companyId });

  if (!task || !user) return res.status(404).json({ message: "Task or user not found" });
  if (task.projectId && String(task.projectId.company) !== String(companyId)) {
    return res.status(404).json({ message: "Project not found" });
  }

  task.assignedTo = userId;
  task.assignedBy = req.user._id;
  await task.save();

  // Store notification for the assigned user
  const assignmentNotification = await Notification.create({
    message: `You have been assigned task "${task.title}"`,
    type: "task",
    user: user._id,
    company: companyId,
    project: task.projectId?._id || task.projectId,
    task: task._id
  });

  // Log activity
  const activity = await ActivityLog.create({
    action: "Task Assigned",
    user: req.user._id,
    details: { taskId, userId, title: task.title }
  });

  // Create activity notification
  const { createActivityNotification } = await import("../controllers/activityController.js");
  await createActivityNotification({
    user: req.user,
    action: `assigned task "${task.title}"`,
    taskId: task._id,
    projectId: task.projectId?._id || task.projectId,
    companyId,
    excludeUserIds: [user._id],
    io: req.app.get("io"),
  });

  req.app.get("io")?.to(`user:${user._id.toString()}`).emit("newNotification", assignmentNotification.toObject());

  const updatedTask = await Task.findById(task._id)
    .populate({ path: "assignedTo", populate: { path: "role", select: "name" } })
    .populate("assignedBy", "name")
    .populate("projectId", "title");
  res.json(updatedTask);
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const companyId = req.user?.company?._id || req.user?.company;
    if (!companyId) return res.status(400).json({ message: "User company is required" });
    const task = await Task.findOne({ _id: req.params.id, company: companyId }).populate('projectId assignedTo');

    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldStatus = task.status;
    task.status = status;
    await task.save();
    if (oldStatus !== status) {
      await ActivityLog.create({
        action: `Updated task "${task.title}" from ${oldStatus} to ${status}`,
        user: req.user._id
      });
    }

    // Store notification for all project members
    if (oldStatus !== status) {
      try {
        const project = task.projectId
          ? await Project.findOne({ _id: task.projectId._id || task.projectId, company: companyId }).select("_id")
          : null;
        if (!task.projectId || project) await notifyProjectParticipants({
          companyId,
          actorId: req.user._id,
          projectId: project?._id,
          taskId: task._id,
          message: `Task "${task.title}" status changed from ${oldStatus} to ${status} by ${req.user.name}`,
          type: "task",
          io: req.app.get("io"),
        });
      } catch (notificationError) {
        console.error("Notification creation failed:", notificationError);
        // Continue without failing the whole operation
      }
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io?.emit('taskUpdated', { taskId: req.params.id, action: 'statusChanged', status, oldStatus });

    const updatedTask = await Task.findById(req.params.id).populate({
      path: 'assignedTo',
      populate: {
        path: 'role',
        select: 'name'
      }
    }).populate('assignedBy', 'name').populate('projectId', 'title');

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getTasks = async (req, res) => {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate({ path: 'assignedTo', populate: { path: 'role', select: 'name' } })
      .populate('assignedBy', 'name');
  res.json(tasks);
};

export const getAllTasks = async (req, res) => {
  try {
    const companyId = req.user?.company?._id || req.user?.company;
    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    const tasks = await Task.find({ company: companyId }).populate({
      path: 'assignedTo',
      populate: {
        path: 'role',
        select: 'name'
      }
    }).populate('assignedBy', 'name').populate('projectId', 'title');
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTasksAssignedToUser = async (req, res) => {
  console.log("getTasksAssignedToUser called");
  console.log("req.user:", req.user);
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  try {
    console.log("Fetching tasks for user:", req.user._id, typeof req.user._id);
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const tasks = await Task.find({ assignedTo: req.user._id }).populate({
      path: 'assignedTo',
      populate: {
        path: 'role',
        select: 'name'
      }
    }).populate('assignedBy', 'name').populate('projectId', 'title');
    console.log("Tasks found:", tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: error.message });
  }
};

export const getMemberCompanyTasks = async (req, res) => {
  try {
    const companyId = req.user?.company?._id || req.user?.company;
    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    const userProjects = await Project.find({
      company: companyId,
      $or: [{ members: req.user._id }, { owner: req.user._id }]
    }).select('_id');
    
    const projectIds = userProjects.map(p => p._id);
    
    const tasks = await Task.find({ 
      projectId: { $in: projectIds },
      company: companyId
    }).populate({
      path: 'assignedTo',
      populate: { path: 'role', select: 'name' }
    }).populate('assignedBy', 'name').populate('projectId', 'title');
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching member company tasks:", error);
    res.status(500).json({ message: error.message });
  }
};
