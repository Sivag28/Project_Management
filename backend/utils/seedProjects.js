import mongoose from "mongoose";
import Project from "../models/Project.js";
import Company from "../models/Company.js";

const COMPANY_ID = '697b5d4a56c184923d54b6d2'; // Comcast
const MEMBERS = [
  '697b5d4a56c184923d54b6d5', // Shivz
  '697b5d9e56c184923d54b6ec', // admin
  '697b618205a435f903a2078c', // admincomcast
  '697b61c205a435f903a207a6', // Mathew
  '6986e6dceccc4bcc92436762', // Shilpa
  '69b2989164870d5e45fec260' // mica
];
const OWNER_ID = '697b5d4a56c184923d54b6d5'; // Shivz

const seedProjects = async () => {
  try {
    console.log('=== Seeding Projects for Comcast ===');
    
    const company = await Company.findById(COMPANY_ID);
    if (!company) {
      console.log('Company not found!');
      return;
    }
    console.log('Company found:', company.name);

    const existingProjects = await Project.find({ company: COMPANY_ID });
    if (existingProjects.length > 0) {
      console.log('Projects already exist, skipping...');
      return;
    }

    const projectTitles = ['Project Alpha - Comcast Sprint 1', 'Project Beta - Comcast Feature Dev', 'Project Gamma - Comcast Testing Phase'];

    for (let i = 0; i < 3; i++) {
      const project = await Project.create({
        title: projectTitles[i],
        description: `Assigned project ${i+1} for all Comcast members including Shivz (Manager/Owner). Status: ${i === 0 ? 'Active' : i === 1 ? 'In Progress' : 'Completed'}.`,
        owner: OWNER_ID,
        members: MEMBERS,
        company: COMPANY_ID,
        status: i === 0 ? 'Active' : i === 1 ? 'In Progress' : 'Completed',
        priority: i === 0 ? 'High' : 'Medium',
        deadline: new Date(Date.now() + (30 + i*15) * 24 * 60 * 60 * 1000)
      });
      console.log(`Created project ${i+1}:`, project.title, '- Members:', project.members.length);
    }

    console.log('=== Projects seeded successfully! ===');
  } catch (error) {
    console.error('Error seeding projects:', error);
  }
};

mongoose.connection.readyState === 1 ? seedProjects() : mongoose.connection.once('connected', seedProjects);

