import Project from "../models/Project.js";
import ProjectMessage from "../models/ProjectMessage.js";
import Task from "../models/Task.js";

const hasProjectAccess = async (project, userId, roleName) => {
  if (!project) return false;
  if (roleName === "Admin") return true;

  const userIdString = userId.toString();
  const isOwner = project.owner?.toString() === userIdString;
  const isMember = project.members?.some((memberId) => memberId.toString() === userIdString);
  const hasAssignedTask = await Task.exists({
    projectId: project._id,
    assignedTo: userId
  });

  return isOwner || isMember || Boolean(hasAssignedTask);
};

const getProjectMessages = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).select("owner members title");

    if (!(await hasProjectAccess(project, req.user._id, req.user.role?.name))) {
      return res.status(403).json({ message: "Access denied" });
    }

    await ProjectMessage.updateMany(
      {
        project: req.params.projectId,
        sender: { $ne: req.user._id },
        seenBy: { $ne: req.user._id }
      },
      {
        $addToSet: { seenBy: req.user._id }
      }
    );

    const messages = await ProjectMessage.find({ project: req.params.projectId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json({
      project: {
        _id: project._id,
        title: project.title
      },
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendProjectMessage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select("owner members title")
      .populate("members", "_id name email");

    if (!(await hasProjectAccess(project, req.user._id, req.user.role?.name))) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.body.content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await ProjectMessage.create({
      project: req.params.projectId,
      sender: req.user._id,
      seenBy: [req.user._id],
      content: req.body.content.trim()
    });

    const populatedMessage = await ProjectMessage.findById(message._id).populate("sender", "name email");
    const assignedTaskUsers = await Task.find({ projectId: project._id }).distinct("assignedTo");
    const recipientIds = [
      project.owner?.toString(),
      ...project.members.map((member) => member._id.toString()),
      ...assignedTaskUsers.map((userId) => userId.toString())
    ].filter((userId, index, array) => userId && array.indexOf(userId) === index && userId !== req.user._id.toString());

    recipientIds.forEach((userId) => {
      req.io?.to(`user:${userId}`).emit("projectChatUnread", {
        projectId: req.params.projectId
      });
    });

    req.io?.to(`project:${req.params.projectId}`).emit("projectChatMessage", {
      projectId: req.params.projectId,
      message: populatedMessage
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadChatCount = async (req, res) => {
  try {
    const accessibleProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).select("_id");
    const taskProjectIds = await Task.find({ assignedTo: req.user._id }).distinct("projectId");
    const accessibleProjectIds = [
      ...accessibleProjects.map((project) => project._id.toString()),
      ...taskProjectIds.map((projectId) => projectId.toString())
    ].filter((projectId, index, array) => projectId && array.indexOf(projectId) === index);

    const unreadCount = await ProjectMessage.countDocuments({
      project: { $in: accessibleProjectIds },
      sender: { $ne: req.user._id },
      seenBy: { $ne: req.user._id }
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markProjectMessagesAsRead = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).select("owner members title");

    if (!(await hasProjectAccess(project, req.user._id, req.user.role?.name))) {
      return res.status(403).json({ message: "Access denied" });
    }

    await ProjectMessage.updateMany(
      {
        project: req.params.projectId,
        sender: { $ne: req.user._id },
        seenBy: { $ne: req.user._id }
      },
      {
        $addToSet: { seenBy: req.user._id }
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getProjectMessages, sendProjectMessage, getUnreadChatCount, markProjectMessagesAsRead, hasProjectAccess };
