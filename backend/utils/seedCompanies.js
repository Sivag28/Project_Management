import mongoose from "mongoose";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Role from "../models/Role.js";

const seedCompanies = async () => {
  try {
    console.log("Starting company seeding...");

    // Get all users without companies
    const usersWithoutCompany = await User.find({ company: { $exists: false } }).populate('role');
    console.log(`Found ${usersWithoutCompany.length} users without companies`);

    if (usersWithoutCompany.length === 0) {
      console.log("No users need company assignment");
      return;
    }

    // Group users by email domain (simple company grouping)
    const companyGroups = {};

    usersWithoutCompany.forEach(user => {
      const domain = user.email.split('@')[1] || 'default';
      if (!companyGroups[domain]) {
        companyGroups[domain] = [];
      }
      companyGroups[domain].push(user);
    });

    console.log(`Creating companies for ${Object.keys(companyGroups).length} domains`);

    // Create companies and assign users
    for (const [domain, users] of Object.entries(companyGroups)) {
      const companyName = domain === 'default' ? 'Default Company' : `${domain.charAt(0).toUpperCase() + domain.slice(1)} Company`;

      // Check if company already exists
      let company = await Company.findOne({ name: companyName });
      if (!company) {
        // Find admin user for owner
        const adminUser = users.find(user => user.role && user.role.name === 'Admin') || users[0];

        company = await Company.create({
          name: companyName,
          description: `Company for ${domain} domain`,
          owner: adminUser._id,
          members: users.map(user => user._id)
        });

        console.log(`Created company: ${companyName} with ${users.length} members`);
      }

      // Assign company to users
      await User.updateMany(
        { _id: { $in: users.map(user => user._id) } },
        { company: company._id }
      );

      console.log(`Assigned ${users.length} users to company: ${companyName}`);
    }

    console.log("Company seeding completed successfully");
  } catch (error) {
    console.error("Error seeding companies:", error);
  }
};

export default seedCompanies;
