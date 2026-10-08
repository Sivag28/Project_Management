import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: String,
  type: { type: String, enum: ['task', 'chat', 'action'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
