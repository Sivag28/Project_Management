import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: String,
  type: { type: String, enum: ['task', 'chat', 'action'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
