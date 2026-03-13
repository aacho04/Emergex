export enum EmergencyStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  AMBULANCE_DISPATCHED = 'ambulance_dispatched',
  PATIENT_PICKED_UP = 'patient_picked_up',
  EN_ROUTE_HOSPITAL = 'en_route_hospital',
  REACHED_HOSPITAL = 'reached_hospital',
  TRANSFERRED = 'transferred',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PatientCondition {
  CRITICAL = 'critical',
  SERIOUS = 'serious',
  MODERATE = 'moderate',
  MINOR = 'minor',
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFF_DUTY = 'off_duty',
}

export enum DutyStatus {
  ON_DUTY = 'on_duty',
  OFF_DUTY = 'off_duty',
}

export type LocationSource = 'sms_link' | 'manual';

export interface Emergency {
  _id: string;
  callerPhone?: string;
  patientName?: string;
  patientCondition?: PatientCondition;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  locationConfirmed: boolean;
  locationSource?: LocationSource;
  smsToken?: string;
  status: EmergencyStatus;
  assignedBy: any;
  assignedAmbulance?: any;
  assignedTrafficPolice: any[];
  assignedHospital?: any;
  distanceToAmbulance?: number;
  distanceToHospital?: number;
  transferredToHospital?: any;
  activatedVolunteers: any[];
  timeline: Array<{
    status: EmergencyStatus;
    timestamp: string;
    note?: string;
  }>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ambulance {
  _id: string;
  user: any;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  dutyStatus: DutyStatus;
  ambulanceStatus: AmbulanceStatus;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  currentEmergency?: any;
  distanceToPatient?: number;
  createdAt: string;
}

export interface Hospital {
  _id: string;
  user: any;
  hospitalName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  specialties: string[];
  totalBeds: number;
  availableBeds: number;
  emergencyCapacity: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  isVerified: boolean;
  distanceToPatient?: number;
}

export interface TrafficPolice {
  _id: string;
  user: any;
  badgeNumber: string;
  assignedArea: string;
  dutyStatus: DutyStatus;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  distanceToPatient?: number;
}

export interface Volunteer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  medicalLicenseNumber?: string;
  medicalStudentCollegeId?: string;
  isAvailable: boolean;
  rewardPoints: number;
  emergenciesAssisted: number;
  currentEmergency?: string;
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    hospitalId: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}
