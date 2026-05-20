import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for efficient querying
companySchema.index({ owner: 1 });
companySchema.index({ members: 1 });

export default mongoose.model("Company", companySchema);
