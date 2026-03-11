import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const volunteerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  medicalLicenseNumber: z.string().optional(),
  medicalStudentCollegeId: z.string().optional(),
});

export const hospitalRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  hospitalName: z.string().min(2, 'Hospital name is required'),
  registrationNumber: z.string().min(2, 'Registration number is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  specialties: z.string().optional(),
  totalBeds: z.number().min(0).optional(),
  availableBeds: z.number().min(0).optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export const createERSOfficerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const createAmbulanceSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  vehicleNumber: z.string().min(2, 'Vehicle number is required'),
  driverName: z.string().min(2, 'Driver name is required'),
  driverPhone: z.string().min(10, 'Valid phone number required'),
});

export const createTrafficPoliceSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  badgeNumber: z.string().min(2, 'Badge number is required'),
  assignedArea: z.string().min(2, 'Assigned area is required'),
});

export const emergencyFormSchema = z.object({
  callerPhone: z.string().optional(),
  patientName: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.enum(['male', 'female', 'other']).optional(),
  patientCondition: z.enum(['critical', 'serious', 'moderate', 'minor']),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  ambulanceId: z.string().optional(),
  trafficPoliceIds: z.array(z.string()).optional(),
  hospitalId: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type VolunteerFormData = z.infer<typeof volunteerFormSchema>;
export type HospitalRegisterFormData = z.infer<typeof hospitalRegisterSchema>;
export type CreateERSOfficerFormData = z.infer<typeof createERSOfficerSchema>;
export type CreateAmbulanceFormData = z.infer<typeof createAmbulanceSchema>;
export type CreateTrafficPoliceFormData = z.infer<typeof createTrafficPoliceSchema>;
export type EmergencyFormData = z.infer<typeof emergencyFormSchema>;
