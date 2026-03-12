import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../users/user.model';
import Ambulance from '../ambulance/ambulance.model';
import Hospital from '../hospital/hospital.model';
import TrafficPolice from '../traffic-police/traffic.model';
import { UserRole, AmbulanceStatus, DutyStatus } from '../../constants/roles';
import { sendVerificationOTP } from '../../config/smtp';
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
    // Normalize identifier to allow case-insensitive username/email login
    const identifier = data.username.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
      isActive: true,
    });
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
    const email = data.email.trim().toLowerCase();
    const username = (data.username || data.email).trim().toLowerCase();
    const registrationNumber = data.registrationNumber.trim();

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      throw new Error('Username or email already exists');
    }

    const existingReg = await Hospital.findOne({ registrationNumber });
    if (existingReg) {
      throw new Error('Registration number already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.HOSPITAL,
      email,
      phone: data.phone,
      isEmailVerified: false,
      emailOTP: otp,
      emailOTPExpiry: otpExpiry,
    });

    await Hospital.create({
      user: user._id,
      hospitalName: data.hospitalName,
      registrationNumber,
      address: data.address,
      phone: data.phone,
      email,
      specialties: data.specialties || [],
      totalBeds: data.totalBeds || 0,
      availableBeds: data.availableBeds || 0,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
    });

    try {
      await sendVerificationOTP(data.email, otp);
    } catch (error) {
      console.error('Failed to send verification OTP:', error);
    }

    return { message: 'Hospital registered. Please check your email for the verification OTP.', email };
  }

  async createHospitalAdmin(data: RegisterHospitalInput) {
    const email = data.email.trim().toLowerCase();
    const username = (data.username || data.email).trim().toLowerCase();
    const registrationNumber = data.registrationNumber.trim();

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      throw new Error('Username or email already exists');
    }

    const existingReg = await Hospital.findOne({ registrationNumber });
    if (existingReg) {
      throw new Error('Registration number already exists');
    }

    const user = await User.create({
      username,
      password: data.password,
      fullName: data.fullName,
      role: UserRole.HOSPITAL,
      email,
      phone: data.phone,
      isEmailVerified: true,
      isActive: true,
    });

    const hospital = await Hospital.create({
      user: user._id,
      hospitalName: data.hospitalName,
      registrationNumber,
      address: data.address,
      phone: data.phone,
      email,
      specialties: data.specialties || [],
      totalBeds: data.totalBeds || 0,
      availableBeds: data.availableBeds || 0,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      isVerified: true,
    });

    return { user, hospital };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await User.findOne({ email, emailOTP: otp });
    if (!user) {
      throw new Error('Invalid OTP');
    }

    if (user.emailOTPExpiry && user.emailOTPExpiry < new Date()) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async resendOTP(email: string) {
    const user = await User.findOne({ email, role: UserRole.HOSPITAL, isEmailVerified: false });
    if (!user) {
      throw new Error('No unverified hospital found with this email');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOTP = otp;
    user.emailOTPExpiry = otpExpiry;
    await user.save();

    await sendVerificationOTP(email, otp);

    return { message: 'New OTP sent to your email' };
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
