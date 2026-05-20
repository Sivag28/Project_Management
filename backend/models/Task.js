import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  priority: String,
  status: { type: String, default: "Backlog" },
  dueDate: Date,
  estimatedHours: Number,
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  isOverdue: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
