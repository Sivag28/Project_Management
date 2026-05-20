import mongoose from "mongoose";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";

const seedRoles = async () => {
  try {
    // Create roles if they don't exist
    const adminRole = await Role.findOneAndUpdate(
      { name: "Admin" },
      { permissions: ["create_project", "assign_task", "view_analytics", "manage_users"] },
      { upsert: true, new: true }
    );

    const managerRole = await Role.findOneAndUpdate(
      { name: "Manager" },
      { permissions: ["create_project", "assign_task", "view_analytics"] },
      { upsert: true, new: true }
    );

    const memberRole = await Role.findOneAndUpdate(
      { name: "Team Member" },
      { permissions: ["update_assigned_task"] },
      { upsert: true, new: true }
    );

    console.log("Roles seeded successfully:");
    console.log("- Admin role:", adminRole._id, adminRole.permissions);
    console.log("- Manager role:", managerRole._id, managerRole.permissions);
    console.log("- Team Member role:", memberRole._id, memberRole.permissions);

    // Create or update default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create default company for admin
    const defaultCompany = await Company.findOneAndUpdate(
      { name: "Default Company" },
      { name: "Default Company", description: "Default company for admin user" },
      { upsert: true, new: true }
    );

    const adminUser = await User.findOneAndUpdate(
      { email: "admin@admin.com" },
      {
        name: "Admin User",
        email: "admin@admin.com",
        password: hashedPassword,
        role: adminRole._id,
        company: defaultCompany._id
      },
      { upsert: true, new: true }
    );

    // Update company owner and members
    defaultCompany.owner = adminUser._id;
    defaultCompany.members.push(adminUser._id);
    await defaultCompany.save();

    console.log("Default admin user ensured:", adminUser.email);

    // Assign roles to existing users if not assigned
    const users = await User.find({ role: { $exists: false } });
    for (const user of users) {
      // Assign default role, e.g., Team Member
      user.role = memberRole._id;
      await user.save();
    }

    console.log("Roles assigned to users");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

export default seedRoles;
