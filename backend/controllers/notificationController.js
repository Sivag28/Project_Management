import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const getCompanyId = (user) => user?.company?._id || user?.company;

export const getNotifications = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) return res.status(400).json({ message: "User company is required" });

    const candidates = await Notification.find({
      user: req.user._id,
      $or: [
        { company: companyId },
        { company: { $exists: false }, project: { $ne: null } },
      ],
    })
      .populate('project', 'title company owner members')
      .sort({ createdAt: -1 });

    const [projectIds, assignedTasks] = await Promise.all([
      Project.find({
        company: companyId,
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).distinct("_id"),
      Task.find({ company: companyId, assignedTo: req.user._id }).select("_id projectId"),
    ]);
    const accessibleProjectIds = new Set(projectIds.map(String));
    const assignedTaskIds = new Set(assignedTasks.map((task) => String(task._id)));
    const assignedProjectIds = new Set(assignedTasks.map((task) => String(task.projectId)).filter(Boolean));
    const visibleNotifications = [];

    for (const notification of candidates) {
      const notificationCompany = notification.company || notification.project?.company;
      if (String(notificationCompany?._id || notificationCompany || '') !== String(companyId)) continue;
      const projectId = String(notification.project?._id || notification.project || '');
      const taskId = String(notification.task || '');
      const hasProjectAccess = projectId &&
        (accessibleProjectIds.has(projectId) || assignedProjectIds.has(projectId));
      const hasTaskAccess = taskId && assignedTaskIds.has(taskId);
      if (!hasProjectAccess && !hasTaskAccess) continue;

      // Safely attach the company to older notifications after verifying the project company.
      if (!notification.company) {
        notification.company = companyId;
        await notification.save();
      }
      visibleNotifications.push(notification);
    }
    res.json(visibleNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) return res.status(400).json({ message: "User company is required" });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, company: companyId },
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const companyId = getCompanyId(req.user);
    if (!companyId) return res.status(400).json({ message: "User company is required" });

    await Notification.updateMany(
      { user: req.user._id, company: companyId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
