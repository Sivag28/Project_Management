import mongoose from "mongoose";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Company from "../models/Company.js";

const seedData = async () => {
  try {
    console.log("Starting data seeding...");

    // Get all companies
    const companies = await Company.find();
    if (companies.length === 0) {
      console.log("No companies found. Please seed companies first.");
      return;
    }

    for (const company of companies) {
      console.log(`Seeding data for company: ${company.name}`);

      // Get users for this company
      const users = await User.find({ company: company._id }).populate('role');
      if (users.length === 0) {
        console.log(`No users found for company ${company.name}`);
        continue;
      }

      // Create sample projects
      const projects = [];
      for (let i = 1; i <= 3; i++) {
        const project = await Project.create({
          title: `Project ${i} - ${company.name}`,
          description: `This is a sample project ${i} for ${company.name}`,
          status: i === 1 ? 'In Progress' : i === 2 ? 'Completed' : 'Planning',
          priority: i === 1 ? 'High' : 'Medium',
          company: company._id,
          members: users.map(u => u._id),
          dueDate: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)) // 30, 60, 90 days
        });
        projects.push(project);
        console.log(`Created project: ${project.title}`);
      }

      // Create sample tasks for each project
      for (const project of projects) {
        const taskStatuses = ['Backlog', 'To Do', 'In Progress', 'Testing', 'Completed'];
        for (let i = 0; i < 5; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const task = await Task.create({
            title: `Task ${i + 1} for ${project.title}`,
            description: `This is a sample task ${i + 1} for project ${project.title}`,
            status: taskStatuses[i % taskStatuses.length],
            priority: i % 2 === 0 ? 'High' : 'Medium',
            project: project._id,
            assignedTo: randomUser._id,
            company: company._id,
            dueDate: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within 30 days
          });
          console.log(`Created task: ${task.title} assigned to ${randomUser.name}`);
        }
      }
    }

    console.log("Data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

export default seedData;
