import ActivityLog from "../models/ActivityLog.js";
import Project from "../models/Project.js";
import { notifyProjectParticipants } from "../utils/projectNotifications.js";

export const getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find().populate("user", "name").sort({ timestamp: -1 });
  res.json(logs);
};

export const createActivityNotification = async (activity) => {
  try {
    const companyId = activity.companyId || activity.user?.company?._id || activity.user?.company;
    if (!companyId) return;

    let project = null;
    if (activity.projectId) {
      project = await Project.findOne({ _id: activity.projectId, company: companyId }).select("title");
      if (!project) return;
    }

    await notifyProjectParticipants({
      companyId,
      actorId: activity.user?._id || activity.user,
      excludeUserIds: activity.excludeUserIds,
      projectId: project?._id,
      taskId: activity.taskId,
      message: `${activity.user?.name || "A team member"}: ${activity.action}${project?.title ? ` · ${project.title}` : ""}`,
      type: "action",
      io: activity.io,
    });
  } catch (error) {
    console.error("Error creating activity notification:", error);
  }
};
