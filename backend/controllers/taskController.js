import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendEmail.js";
import { taskAssignmentTemplate, taskStatusUpdateTemplate } from "../utils/emailTemplates.js";

export const createTask = async (req, res) => {
  const companyId = req.user?.company?._id || req.user?.company;
  if (!companyId) {
    return res.status(400).json({ message: "User company is required" });
  }

  const task = await Task.create({ ...req.body, company: companyId });
  res.json(task);
};

export const assignTask = async (req, res) => {
  const { taskId, userId } = req.body;
  const task = await Task.findById(taskId).populate('projectId');
  const user = await User.findById(userId);

  if (!task || !user) return res.status(404).json({ message: "Task or user not found" });

  task.assignedTo = userId;
  await task.save();

  // Send email
  await sendEmail(user.email, "Task Assigned", taskAssignmentTemplate(user.name, task.title, task.projectId.title));

  // Store notification for the assigned user
  await Notification.create({
    message: `You have been assigned task "${task.title}"`,
    type: "task",
    project: task.projectId
  });

  // Log activity
  const activity = await ActivityLog.create({
    action: "Task Assigned",
    user: req.user._id,
    details: { taskId, userId, title: task.title }
  });

  // Create activity notification
  const { createActivityNotification } = await import("../controllers/activityController.js");
  await createActivityNotification({ user: req.user, action: "Task Assigned" });

  res.json(task);
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id).populate('projectId assignedTo');

    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    // Send email to project members (only if project exists)
    if (task.project) {
      try {
        const project = await Project.findById(task.project).populate('members');
        if (project && project.members) {
          for (const member of project.members) {
            if (member._id.toString() !== req.user._id.toString()) {
              try {
                await sendEmail(member.email, "Task Status Updated", taskStatusUpdateTemplate(req.user.name, task.title, status, project.title));
              } catch (emailError) {
                console.error("Email sending failed:", emailError);
                // Continue without failing the whole operation
              }
            }
          }
        }
      } catch (projectError) {
        console.error("Project population failed:", projectError);
        // Continue without failing the whole operation
      }
    }

    // Store notification for all project members
    if (task.projectId) {
      try {
        const project = await Project.findById(task.projectId).populate('members');
        if (project && project.members) {
          const notifications = project.members.map(member => ({
            message: `Task "${task.title}" status changed from ${oldStatus} to ${status} by ${req.user.name}`,
            type: "task",
            user: member._id,
            project: task.projectId
          }));
          await Notification.insertMany(notifications);
        }
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
    }).populate('projectId', 'title');

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getTasks = async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId });
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
    }).populate('projectId', 'title');
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
    }).populate('projectId', 'title');
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
    }).populate('projectId', 'title');
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching member company tasks:", error);
    res.status(500).json({ message: error.message });
  }
};
