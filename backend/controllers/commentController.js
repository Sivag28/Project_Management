import Comment from "../models/Comment.js";
import User from "../models/User.js";

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

    const mentions = content.match(/@(\w+)/g)?.map((m) => m.slice(1)) || [];
    const mentionedUsers = await User.find({ name: { $in: mentions } });

    const comment = await Comment.create({
      task: req.params.taskId,
      user: req.user._id,
      company: companyId,
      content,
      mentions: mentionedUsers.map((u) => u._id)
    });

    const populatedComment = await Comment.findById(comment._id).populate("user", "name");

    const { createActivityNotification } = await import("../controllers/activityController.js");
    await createActivityNotification({ user: req.user, action: "Added a comment" });

    res.json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
