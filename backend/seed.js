import dotenv from 'dotenv';
import connectDB from './config/db.js';
import seedRoles from './utils/seedRoles.js';

dotenv.config();
connectDB();

import seedCompanies from './utils/seedCompanies.js';
import seedData from './utils/seedData.js';

const runAllSeeds = async () => {
  try {
    console.log('🚀 Running seeders (skipping seedProjects - hardcoded)...');
    
    await seedRoles();
    await seedCompanies();
    // seedProjects is IIFE with hardcoded IDs, skip
    await seedData();
    
    console.log('✅ Essential data (roles/companies/data) seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

runAllSeeds();
