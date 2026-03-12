'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Building2, Bed, Users, Settings, AlertTriangle, Phone, User, Navigation } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hospitalAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { formatDate, formatTime } from '@/utils/helpers';
import Link from 'next/link';

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
      Loading map...
    </div>
  ),
});

interface TrackedEmergency {
  emergencyId: string;
  ambulanceId?: string;
  ambulanceLocation?: { lat: number; lng: number };
  patientLocation?: { lat: number; lng: number };
  hospitalLocation?: { lat: number; lng: number };
  phase: 'to_patient' | 'to_hospital';
}

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState<any>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Live tracking: keyed by emergencyId
  const [trackedEmergencies, setTrackedEmergencies] = useState<Record<string, TrackedEmergency>>({});
  const { on, off } = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const [hospitalRes, emergenciesRes] = await Promise.all([
        hospitalAPI.getMe(),
        hospitalAPI.getMyEmergencies(),
      ]);
      setHospital(hospitalRes.data.data);
      setEmergencies(emergenciesRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for real-time incoming patient alerts
  useEffect(() => {
    const handleIncoming = (data: any) => {
      setToast({ message: `Incoming patient: ${data.emergency?.patientName || 'Unknown'}`, type: 'success' });
      // Start tracking this ambulance en route to hospital (phase 1: to_patient)
      if (data.emergencyId && data.ambulanceLocation) {
        setTrackedEmergencies((prev) => ({
          ...prev,
          [data.emergencyId]: {
            emergencyId: data.emergencyId,
            ambulanceId: data.ambulanceId,
            ambulanceLocation: data.ambulanceLocation,
            patientLocation: data.patientLocation,
            hospitalLocation: data.hospitalLocation,
            phase: 'to_patient',
          },
        }));
      }
      fetchData();
    };

    const handleStatus = (data: any) => {
      fetchData();
    };

    // Ambulance picked up patient — phase switches to to_hospital
    const handlePhaseUpdate = (data: any) => {
      if (data.phase === 'to_hospital' && data.emergencyId) {
        setTrackedEmergencies((prev) => {
          const existing = prev[data.emergencyId] || {};
          return {
            ...prev,
            [data.emergencyId]: {
              ...existing,
              emergencyId: data.emergencyId,
              ambulanceId: data.ambulanceId || existing.ambulanceId,
              ambulanceLocation: data.ambulanceLocation || existing.ambulanceLocation,
              patientLocation: data.patientLocation || existing.patientLocation,
              hospitalLocation: data.hospitalLocation || data.hospital?.location || existing.hospitalLocation,
              phase: 'to_hospital',
            },
          };
        });
        setToast({ message: 'Patient picked up — ambulance en route to hospital', type: 'success' });
      }
    };

    // Live ambulance location updates
    const handleAmbulanceLocation = (data: any) => {
      if (data.ambulanceId && data.emergencyId) {
        setTrackedEmergencies((prev) => {
          const existing = prev[data.emergencyId];
          if (!existing) return prev;
          return {
            ...prev,
            [data.emergencyId]: { ...existing, ambulanceLocation: data.location },
          };
        });
      }
    };

    on('hospital:incoming', handleIncoming);
    on('emergency:status', handleStatus);
    on('ambulance:phase-update', handlePhaseUpdate);
    on('ambulance:location', handleAmbulanceLocation);

    return () => {
      off('hospital:incoming', handleIncoming);
      off('emergency:status', handleStatus);
      off('ambulance:phase-update', handlePhaseUpdate);
      off('ambulance:location', handleAmbulanceLocation);
    };
  }, [on, off, fetchData]);

  if (loading) return <PageLoader />;

  if (!hospital) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Hospital profile not found</p>
        </div>
      </div>
    );
  }

  const activeEmergencies = emergencies.filter((e) =>
    ['ambulance_dispatched', 'patient_picked_up', 'en_route_hospital', 'reached_hospital'].includes(e.status)
  );
  const pastEmergencies = emergencies.filter((e) =>
    ['transferred', 'completed', 'cancelled'].includes(e.status)
  );

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{hospital.hospitalName || hospital.name}</h2>
          <p className="text-gray-500 mt-1">{hospital.address}</p>
        </div>
        <div className="flex items-center gap-2">
          {hospital.isVerified ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              Pending Verification
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Beds" value={hospital.totalBeds || 0} icon={Bed} color="primary" />
        <StatCard title="Available Beds" value={hospital.availableBeds || 0} icon={Bed} color="success" />
        <StatCard title="Active Patients" value={activeEmergencies.length} icon={AlertTriangle} color="danger" />
        <StatCard title="Emergency Capacity" value={hospital.emergencyCapacity ? 'Yes' : 'No'} icon={Building2} color="warning" />
      </div>

      {/* Active / Incoming Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Patients
            {activeEmergencies.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                {activeEmergencies.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ambulance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Distance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody>
              {activeEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                    No active patients assigned to this hospital
                  </td>
                </tr>
              ) : (
                activeEmergencies.map((e: any) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{e.patientName || 'Unknown'}</div>
                          {e.callerPhone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />{e.callerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {e.patientCondition ? <Badge status={e.patientCondition} /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4"><Badge status={e.status} /></td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {e.assignedAmbulance?.vehicleNumber || '—'}
                      {e.assignedAmbulance?.driverName && (
                        <div className="text-xs text-gray-400">{e.assignedAmbulance.driverName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {e.distanceToHospital != null ? `${e.distanceToHospital} km` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{formatDate(e.createdAt)}</div>
                      <div className="text-xs text-gray-400">{formatTime(e.createdAt)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live Ambulance Tracking Maps (one per active tracked emergency) */}
      {Object.values(trackedEmergencies).map((tracked) => {
        const emergency = activeEmergencies.find((e: any) => e._id === tracked.emergencyId);
        const hasPickedUp = ['patient_picked_up', 'en_route_hospital', 'reached_hospital'].includes(emergency?.status || '');
        // Only show map when ambulance is en route to patient or has picked up patient
        return (
          <Card key={tracked.emergencyId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary-600" />
                Live Ambulance Tracking
                {emergency && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    — {emergency.patientName || 'Patient'}
                  </span>
                )}
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                  tracked.phase === 'to_hospital'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {tracked.phase === 'to_hospital' ? '🚑 → 🏥 En Route to Hospital' : '🚑 → 🧑 Going to Patient'}
                </span>
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-4">
              {/* Coordinate info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {tracked.ambulanceLocation && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-700 uppercase mb-1">🚑 Ambulance</p>
                    <p className="text-xs text-gray-700 font-mono">
                      {tracked.ambulanceLocation.lat.toFixed(5)}, {tracked.ambulanceLocation.lng.toFixed(5)}
                    </p>
                  </div>
                )}
                {tracked.patientLocation && !hasPickedUp && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-1">🧑 Patient</p>
                    <p className="text-xs text-gray-700 font-mono">
                      {tracked.patientLocation.lat.toFixed(5)}, {tracked.patientLocation.lng.toFixed(5)}
                    </p>
                  </div>
                )}
                {tracked.hospitalLocation && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-700 uppercase mb-1">🏥 This Hospital</p>
                    <p className="text-xs text-gray-700 font-mono">
                      {tracked.hospitalLocation.lat.toFixed(5)}, {tracked.hospitalLocation.lng.toFixed(5)}
                    </p>
                  </div>
                )}
              </div>
              <LiveTrackingMap
                ambulancePosition={tracked.ambulanceLocation || null}
                patientPosition={!hasPickedUp ? (tracked.patientLocation || null) : null}
                hospitalPosition={tracked.hospitalLocation || null}
                phase={tracked.phase}
                showDirections={true}
                height="350px"
              />
            </div>
          </Card>
        );
      })}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialties */}
        <Card>
          <CardHeader><CardTitle>Specialties</CardTitle></CardHeader>
          <div className="px-6 pb-6">
            {hospital.specialties?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hospital.specialties.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No specialties listed</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <div className="px-6 pb-6 space-y-3">
            <Link href="/dashboard/hospital/volunteers" className="block">
              <div className="p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage Volunteers</p>
                    <p className="text-xs text-gray-500">View and rate nearby volunteers</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dashboard/hospital/settings" className="block">
              <div className="p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hospital Settings</p>
                    <p className="text-xs text-gray-500">Update beds, specialties & info</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Past Emergencies */}
      {pastEmergencies.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Patients</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {pastEmergencies.map((e: any) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{e.patientName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{e.callerPhone || ''}</div>
                    </td>
                    <td className="py-3 px-4">
                      {e.patientCondition ? <Badge status={e.patientCondition} /> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4"><Badge status={e.status} /></td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{formatDate(e.createdAt)}</div>
                      <div className="text-xs text-gray-400">{formatTime(e.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Contact Info */}
      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
              <p className="text-sm text-gray-900 mt-1">{hospital.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
              <p className="text-sm text-gray-900 mt-1">{hospital.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Location</p>
              <p className="text-sm text-gray-900 mt-1">
                {hospital.location?.coordinates
                  ? `${hospital.location.coordinates[1].toFixed(4)}, ${hospital.location.coordinates[0].toFixed(4)}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

