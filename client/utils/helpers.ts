import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-amber-600 bg-amber-50',
    assigned: 'text-blue-600 bg-blue-50',
    ambulance_dispatched: 'text-indigo-600 bg-indigo-50',
    patient_picked_up: 'text-purple-600 bg-purple-50',
    en_route_hospital: 'text-cyan-600 bg-cyan-50',
    reached_hospital: 'text-green-600 bg-green-50',
    transferred: 'text-teal-600 bg-teal-50',
    completed: 'text-emerald-600 bg-emerald-50',
    cancelled: 'text-red-600 bg-red-50',
    available: 'text-green-600 bg-green-50',
    busy: 'text-red-600 bg-red-50',
    on_duty: 'text-green-600 bg-green-50',
    off_duty: 'text-gray-600 bg-gray-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function formatStatusText(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function getRoleDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    super_admin: '/dashboard/super-admin',
    ers_officer: '/dashboard/ers',
    ambulance: '/dashboard/ambulance',
    traffic_police: '/dashboard/traffic-police',
    hospital: '/dashboard/hospital',
  };
  return paths[role] || '/dashboard';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    ers_officer: 'ERS Officer',
    ambulance: 'Ambulance',
    traffic_police: 'Traffic Police',
    hospital: 'Hospital',
  };
  return labels[role] || role;
}
