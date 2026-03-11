export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ERS_OFFICER = 'ers_officer',
  AMBULANCE = 'ambulance',
  TRAFFIC_POLICE = 'traffic_police',
  HOSPITAL = 'hospital',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    email?: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  ersOfficers: number;
  ambulances: number;
  trafficPolice: number;
  hospitals: number;
}
