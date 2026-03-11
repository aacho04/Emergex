import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/users/user.model';
import { UserRole } from '../constants/roles';

dotenv.config({ path: '../../.env' });

const seed = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergex';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding');

    // Check if super admin exists
    const existing = await User.findOne({ role: UserRole.SUPER_ADMIN });
    if (existing) {
      console.log('Super Admin already exists. Skipping...');
    } else {
      await User.create({
        username: 'superadmin',
        password: 'Admin@123',
        fullName: 'Super Administrator',
        role: UserRole.SUPER_ADMIN,
        email: 'admin@emergex.com',
        isActive: true,
        isEmailVerified: true,
      });
      console.log('Super Admin created successfully');
      console.log('Username: superadmin');
      console.log('Password: Admin@123');
    }

    await mongoose.disconnect();
    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
