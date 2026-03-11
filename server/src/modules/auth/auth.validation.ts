import { z } from 'zod';
import { UserRole } from '../../constants/roles';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerERSOfficerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const registerHospitalSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  email: z.string().email('Valid email is required'),
  hospitalName: z.string().min(2),
  registrationNumber: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(10),
  specialties: z.array(z.string()).optional(),
  totalBeds: z.number().min(0).optional(),
  availableBeds: z.number().min(0).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).refine(
  (data) => (data.availableBeds ?? 0) <= (data.totalBeds ?? 0),
  { message: 'Available beds cannot exceed total beds', path: ['availableBeds'] }
);

export const createAmbulanceSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10),
  vehicleNumber: z.string().min(2),
  driverName: z.string().min(2),
  driverPhone: z.string().min(10),
});

export const createTrafficPoliceSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10),
  badgeNumber: z.string().min(2),
  assignedArea: z.string().min(2),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterERSOfficerInput = z.infer<typeof registerERSOfficerSchema>;
export type RegisterHospitalInput = z.infer<typeof registerHospitalSchema>;
export type CreateAmbulanceInput = z.infer<typeof createAmbulanceSchema>;
export type CreateTrafficPoliceInput = z.infer<typeof createTrafficPoliceSchema>;
