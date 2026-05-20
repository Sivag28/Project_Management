import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find().populate("user", "name").sort({ timestamp: -1 });
  res.json(logs);
};

export const createActivityNotification = async (activity) => {
  try {
    // Get all users to notify about the action
    const users = await User.find({}, '_id');
    const notifications = users.map(user => ({
      user: user._id,
      message: `${activity.user.name} performed action: ${activity.action}`,
      type: "action"
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error creating activity notification:", error);
  }
};
