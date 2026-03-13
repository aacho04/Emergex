export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ERS_OFFICER = 'ers_officer',
  AMBULANCE = 'ambulance',
  TRAFFIC_POLICE = 'traffic_police',
  HOSPITAL = 'hospital',
}

export enum DutyStatus {
  ON_DUTY = 'on_duty',
  OFF_DUTY = 'off_duty',
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFF_DUTY = 'off_duty',
}

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

export const ROLES = Object.values(UserRole);
