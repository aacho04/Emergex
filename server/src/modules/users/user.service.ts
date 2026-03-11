import User, { IUser } from './user.model';
import { UserRole } from '../../constants/roles';

export class UserService {
  async getAllUsers(role?: UserRole) {
    const filter: any = {};
    if (role) filter.role = role;
    return User.find(filter).select('-password -emailVerificationToken');
  }

  async getUserById(id: string) {
    return User.findById(id).select('-password -emailVerificationToken');
  }

  async updateUser(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true }).select(
      '-password -emailVerificationToken'
    );
  }

  async deactivateUser(id: string) {
    return User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async activateUser(id: string) {
    return User.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }

  async getERSOfficers() {
    return User.find({ role: UserRole.ERS_OFFICER, isActive: true }).select(
      '-password -emailVerificationToken'
    );
  }

  async getDashboardStats() {
    const [totalUsers, ersOfficers, ambulances, trafficPolice, hospitals] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: UserRole.ERS_OFFICER, isActive: true }),
      User.countDocuments({ role: UserRole.AMBULANCE, isActive: true }),
      User.countDocuments({ role: UserRole.TRAFFIC_POLICE, isActive: true }),
      User.countDocuments({ role: UserRole.HOSPITAL, isActive: true }),
    ]);

    return { totalUsers, ersOfficers, ambulances, trafficPolice, hospitals };
  }
}

export default new UserService();
