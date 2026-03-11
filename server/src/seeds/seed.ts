import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/users/user.model';
import { UserRole } from '../constants/roles';

dotenv.config({ path: '../../.env' });

export const ensureSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: UserRole.SUPER_ADMIN });
    if (existing) {
      console.log('✅ Super Admin already exists');
      return;
    }

    const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@emergex.com';
    const fullName = process.env.SUPER_ADMIN_FULLNAME || 'Super Administrator';

    await User.create({
      username,
      password,
      fullName,
      role: UserRole.SUPER_ADMIN,
      email,
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`✅ Super Admin created (username: ${username})`);
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
  }
};

// Run standalone if called directly
if (require.main === module) {
  const run = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergex';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding');
    await ensureSuperAdmin();
    await mongoose.disconnect();
    console.log('Seeding complete');
    process.exit(0);
  };
  run().catch((err) => { console.error(err); process.exit(1); });
}
