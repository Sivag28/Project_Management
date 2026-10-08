import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user", "name")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const companyId = req.user?.company?._id || req.user?.company;

    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    const task = await Task.findOne({ _id: req.params.taskId, company: companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const project = task.projectId
      ? await Project.findOne({ _id: task.projectId, company: companyId }).select("owner members title")
      : null;
    if (task.projectId && !project) return res.status(404).json({ message: "Project not found" });
    const userId = String(req.user._id);
    const isProjectParticipant = project && (
      String(project.owner) === userId || project.members.some((memberId) => String(memberId) === userId)
    );
    const isAssignedToTask = String(task.assignedTo || "") === userId;
    if (!isProjectParticipant && !isAssignedToTask) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    const mentions = content.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
    const projectUserIds = project
      ? [...project.members.map(String), String(project.owner)]
      : [String(task.assignedTo || "")];
    const mentionedUsers = await User.find({ name: { $in: mentions }, company: companyId, _id: { $in: projectUserIds } });

    const comment = await Comment.create({
      task: req.params.taskId,
      user: req.user._id,
      company: companyId,
      content,
      mentions: mentionedUsers.map((u) => u._id)
    });

    const populatedComment = await Comment.findById(comment._id).populate("user", "name");

    const { createActivityNotification } = await import("../controllers/activityController.js");
    await createActivityNotification({
      user: req.user,
      action: `commented on ${task.title}`,
      taskId: task._id,
      projectId: project?._id,
      companyId,
      io: req.app.get("io"),
    });

    res.json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
