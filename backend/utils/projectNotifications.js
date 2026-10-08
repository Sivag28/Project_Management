import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

export const notifyProjectParticipants = async ({
  companyId,
  actorId,
  excludeUserIds = [],
  message,
  type = "action",
  projectId,
  taskId,
  io,
}) => {
  if (!companyId || !message) return [];

  try {
    const recipientIds = new Set();
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, company: companyId }).select("owner members");
      if (!project) return [];
      (project.members || []).forEach((memberId) => recipientIds.add(String(memberId)));
      if (project.owner) recipientIds.add(String(project.owner));
      const projectAssignees = await Task.find({ company: companyId, projectId }).distinct("assignedTo");
      projectAssignees.filter(Boolean).forEach((assigneeId) => recipientIds.add(String(assigneeId)));
    }
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, company: companyId }).select("assignedTo");
      if (!task) return [];
      if (task.assignedTo) recipientIds.add(String(task.assignedTo));
    }

    const excludedIds = [...new Set([actorId, ...excludeUserIds].filter(Boolean).map(String))];
    const eligibleIds = [...recipientIds].filter((id) => !excludedIds.includes(id));
    if (!eligibleIds.length) return [];

    const recipients = await User.find({ company: companyId, _id: { $in: eligibleIds } }).select("_id");
    const created = await Notification.insertMany(recipients.map((recipient) => ({
      user: recipient._id,
      company: companyId,
      ...(projectId ? { project: projectId } : {}),
      ...(taskId ? { task: taskId } : {}),
      message,
      type,
    })));

    created.forEach((notification) => {
      io?.to(`user:${notification.user.toString()}`).emit("newNotification", notification.toObject());
    });
    return created;
  } catch (error) {
    console.error("Error creating project notifications:", error);
    return [];
  }
};
