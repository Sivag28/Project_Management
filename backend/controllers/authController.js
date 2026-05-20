import User from "../models/User.js";
import Role from "../models/Role.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

export const register = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const { name, email, password, companyName, role } = req.body;

    if (!name || !email || !password || !companyName || !role) {
      console.log("Missing fields:", { name, email, password, companyName, role });
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    console.log("Existing user check:", existingUser);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if company exists, if not create it
    let company = await Company.findOne({ name: companyName });
    if (!company) {
      company = await Company.create({ name: companyName, owner: null }); // Will set owner after user creation
    }

    // Map frontend role names to backend role names
    const roleMapping = {
      "admin": "Admin",
      "manager": "Manager",
      "team member": "Team Member"
    };

    const backendRoleName = roleMapping[role.toLowerCase()];
    if (!backendRoleName) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Find the selected role
    const selectedRole = await Role.findOne({ name: backendRoleName });
    if (!selectedRole) {
      return res.status(500).json({ message: `Role '${backendRoleName}' not found. Please seed roles first.` });
    }

    const user = await User.create({ name, email, password, role: selectedRole._id, company: company._id });
    console.log("User created:", user);

    // If company was just created, set the owner
    if (!company.owner) {
      company.owner = user._id;
      company.members.push(user._id);
      await company.save();
    } else {
      // Add user to existing company members
      company.members.push(user._id);
      await company.save();
    }

    const populatedUser = await User.findById(user._id).populate('role').populate('company');
    res.json({ user: populatedUser, token: generateToken(user._id) });
  } catch (error) {
    console.log("Register error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    console.log("Login attempt for:", req.body.email);
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('role').populate('company');
    console.log("User found:", user ? user._id : null);
    console.log("User role:", user?.role);
    console.log("User permissions:", user?.role?.permissions);

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    console.log("Login successful, token generated");
    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
