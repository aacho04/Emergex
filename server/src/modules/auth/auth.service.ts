import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../users/user.model';
import Ambulance from '../ambulance/ambulance.model';
import Hospital from '../hospital/hospital.model';
import TrafficPolice from '../traffic-police/traffic.model';
import { UserRole, AmbulanceStatus, DutyStatus } from '../../constants/roles';
import { sendVerificationEmail } from '../../config/smtp';
import {
  LoginInput,
  RegisterERSOfficerInput,
  RegisterHospitalInput,
  CreateAmbulanceInput,
  CreateTrafficPoliceInput,
} from './auth.validation';

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'emergex_jwt_secret';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    secret,
    { expiresIn }
  );
};

export class AuthService {
  async login(data: LoginInput) {
    const user = await User.findOne({ username: data.username, isActive: true });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (user.role === UserRole.HOSPITAL && !user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
      },
    };
  }

  async registerERSOfficer(data: RegisterERSOfficerInput) {
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      throw new Error('Username already exists');
    }

    const user = await User.create({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.ERS_OFFICER,
      phone: data.phone,
      email: data.email,
    });

    return { user };
  }

  async registerHospital(data: RegisterHospitalInput) {
    const existing = await User.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });
    if (existing) {
      throw new Error('Username or email already exists');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.HOSPITAL,
      email: data.email,
      phone: data.phone,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });

    await Hospital.create({
      user: user._id,
      hospitalName: data.hospitalName,
      registrationNumber: data.registrationNumber,
      address: data.address,
      phone: data.phone,
      email: data.email,
      specialties: data.specialties || [],
      totalBeds: data.totalBeds || 0,
      availableBeds: data.availableBeds || 0,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
    });

    try {
      await sendVerificationEmail(data.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return { message: 'Hospital registered. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async createAmbulance(data: CreateAmbulanceInput) {
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      throw new Error('Username already exists');
    }

    const user = await User.create({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.AMBULANCE,
      phone: data.phone,
    });

    const ambulance = await Ambulance.create({
      user: user._id,
      vehicleNumber: data.vehicleNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      dutyStatus: DutyStatus.OFF_DUTY,
      ambulanceStatus: AmbulanceStatus.OFF_DUTY,
    });

    return { user, ambulance };
  }

  async createTrafficPolice(data: CreateTrafficPoliceInput) {
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      throw new Error('Username already exists');
    }

    const user = await User.create({
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.TRAFFIC_POLICE,
      phone: data.phone,
    });

    const trafficPolice = await TrafficPolice.create({
      user: user._id,
      badgeNumber: data.badgeNumber,
      assignedArea: data.assignedArea,
      dutyStatus: DutyStatus.OFF_DUTY,
    });

    return { user, trafficPolice };
  }
}

export default new AuthService();
