import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // Clear existing users
    await User.deleteMany();

    // Create the Master Admin
    const adminUser = {
      name: 'Master Admin',
      email: 'admin@example.com',
      password: 'adminpassword123', // Will be hashed by the User model pre-save hook
      role: 'admin',
      department: 'none'
    };

    await User.create(adminUser);

    console.log('--- Data Imported: Admin Created! ---');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    console.log('--- Data Destroyed! ---');
    process.exit();
  } catch (error) {
    console.error(`Error with data destruction: ${error.message}`);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}