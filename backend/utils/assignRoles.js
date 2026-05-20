import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { connectDB } from "../config/db.js";

const assignRoles = async () => {
  try {
    await connectDB();

    // Get the default role
    const defaultRole = await Role.findOne({ name: "Team Member" });
    if (!defaultRole) {
      console.log("Default role not found. Please run seedRoles.js first.");
      process.exit(1);
    }

    // Find users without roles
    const usersWithoutRoles = await User.find({ role: { $exists: false } });
    console.log(`Found ${usersWithoutRoles.length} users without roles`);

    // Assign default role to users without roles
    for (const user of usersWithoutRoles) {
      user.role = defaultRole._id;
      await user.save();
      console.log(`Assigned role to user: ${user.name}`);
    }

    console.log("Role assignment completed");
    process.exit(0);
  } catch (error) {
    console.error("Error assigning roles:", error);
    process.exit(1);
  }
};

assignRoles();
