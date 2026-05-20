import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deadline: Date,
  status: { type: String, default: "Active" },
  priority: { type: String, default: "Medium" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
