import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";

export const getUsers = async (req, res) => {
  try {
    const companyId = req.user?.company?._id || req.user?.company;
    if (!companyId) {
      return res.status(400).json({ message: "User company is required" });
    }

    const users = await User.find({ company: companyId }).select("-password").populate("role");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (role) {
    if (mongoose.Types.ObjectId.isValid(role)) {
      // If role is an ObjectId, set it directly
      user.role = role;
    } else {
      // Map old lowercase names to proper names
      let roleName = role;
      if (role === "admin") roleName = "Admin";
      else if (role === "manager") roleName = "Manager";
      else if (role === "member") roleName = "Team Member";

      // Find by name
      const roleDoc = await Role.findOne({ name: roleName });
      if (!roleDoc) {
        return res.status(400).json({ message: `Invalid role: ${role}` });
      }
      user.role = roleDoc._id;
    }
  }

  await user.save();
  const updatedUser = await User.findById(id).populate("role");
  res.json(updatedUser);
};
