import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true }
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
