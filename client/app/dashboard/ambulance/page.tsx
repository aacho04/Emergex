'use client';

import { useEffect, useState, useCallback } from 'react';
import { Power, Navigation, AlertTriangle, Truck, Building2, CheckCircle, Phone, User } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import LiveTrackingMap, { MapMarker } from '@/components/maps/LiveTrackingMap';
import { ambulanceAPI, emergencyAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useLocationStore } from '@/store/locationStore';
import { formatDate, formatTime } from '@/utils/helpers';
import { useDemoAmbulanceSimulation } from '@/hooks/useDemoAmbulanceSimulation';

const DEMO_MODE = true;

const DEMO_HOSPITAL_POSITION = { lat: 18.88991, lng: 73.1665073 };
const DEMO_PATIENT_POSITION = { lat: 18.8936, lng: 73.1728 };
const DEMO_AMBULANCE_START = { lat: 18.8893, lng: 73.1656 };

const TRAFFIC_ALERT_POINTS = [
  {
    id: 'traffic1',
    label: 'Rasayani Bridge',
    position: { lat: 18.890072, lng: 73.171079 },
  },
  {
    id: 'traffic3',
    label: 'Dand Apta Road',
    position: { lat: 18.894219, lng: 73.1733 },
  },
];

const TRAFFIC_MARKERS: MapMarker[] = TRAFFIC_ALERT_POINTS.map((point) => ({
  id: point.id,
  label: point.label,
  position: point.position,
  type: 'traffic',
}));

export default function AmbulanceDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [currentEmergency, setCurrentEmergency] = useState<any>(null);
  const [myEmergencies, setMyEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Navigation state
  const [navPhase, setNavPhase] = useState<'to_patient' | 'to_hospital'>('to_patient');
  const [patientPos, setPatientPos] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitalPos, setHospitalPos] = useState<{ lat: number; lng: number } | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<any>(null);

  const { emit, on, off } = useSocket();
  const { latitude, longitude, requestLocation } = useLocationStore();

  const hospitalCoords = profile?.hospital?.location?.coordinates;
  const associatedHospitalPos = hospitalCoords && (hospitalCoords[0] !== 0 || hospitalCoords[1] !== 0)
    ? { lat: hospitalCoords[1], lng: hospitalCoords[0] }
    : null;

  const demoPatientPos = DEMO_MODE ? DEMO_PATIENT_POSITION : patientPos;
  const demoHospitalPos = DEMO_MODE ? DEMO_HOSPITAL_POSITION : hospitalPos;
  const demoStartPos = DEMO_MODE ? DEMO_AMBULANCE_START : null;

  const demoSimulation = useDemoAmbulanceSimulation({
    enabled: DEMO_MODE,
    startPosition: demoStartPos,
    patientPosition: demoPatientPos,
    hospitalPosition: demoHospitalPos,
    trafficPoints: TRAFFIC_ALERT_POINTS,
    alertLeadSeconds: 3,
    onTrafficAlert: (points) => {
      const labels = points.map((point) => point.label).join(' and ');
      setToast({ message: `Traffic alert sent to ${labels}`, type: 'success' });
    },
  });

  const fetchData = useCallback(async () => {
    try {
      const emergenciesRes = await emergencyAPI.getMy();
      const emergencies = emergenciesRes.data.data || [];
      setMyEmergencies(emergencies);

      const active = emergencies.find(
        (e: any) => ['assigned', 'ambulance_dispatched', 'patient_picked_up', 'en_route_hospital'].includes(e.status)
      );
      if (active) {
        setCurrentEmergency(active);
        // Set navigation positions
        if (active.location?.coordinates) {
          setPatientPos({
            lat: active.location.coordinates[1],
            lng: active.location.coordinates[0],
          });
        }
        if (active.assignedHospital?.location?.coordinates) {
          setHospitalPos({
            lat: active.assignedHospital.location.coordinates[1],
            lng: active.assignedHospital.location.coordinates[0],
          });
        }
        // Determine which phase
        if (['patient_picked_up', 'en_route_hospital'].includes(active.status)) {
          setNavPhase('to_hospital');
        } else {
          setNavPhase('to_patient');
        }
      } else {
        setCurrentEmergency(null);
      }

      try {
        const profileRes = await ambulanceAPI.getMe();
        setProfile(profileRes.data.data);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    requestLocation();
  }, [fetchData, requestLocation]);

  // Listen for new emergency alerts
  useEffect(() => {
    const handleAlert = (data: any) => {
      setIncomingAlert(data);
      setToast({ message: 'New emergency assigned!', type: 'success' });
      if (data.emergency?.location) {
        setPatientPos(data.emergency.location);
      }
      if (data.hospital?.location) {
        setHospitalPos(data.hospital.location);
      }
      setNavPhase('to_patient');
      fetchData();
    };

    const handlePhaseUpdate = (data: any) => {
      if (data.phase === 'to_hospital') {
        setNavPhase('to_hospital');
        if (data.hospital?.location) {
          setHospitalPos(data.hospital.location);
        }
      }
    };

    on('ambulance:alert', handleAlert);
    on('ambulance:phase-update', handlePhaseUpdate);

    return () => {
      off('ambulance:alert', handleAlert);
      off('ambulance:phase-update', handlePhaseUpdate);
    };
  }, [on, off, fetchData]);

  // Share location periodically
  useEffect(() => {
    const activeLat = associatedHospitalPos?.lat ?? latitude;
    const activeLng = associatedHospitalPos?.lng ?? longitude;

    if (!activeLat || !activeLng) return;

    const interval = setInterval(() => {
      emit('ambulance:update-location', { lat: activeLat, lng: activeLng });
    }, 10000);

    return () => clearInterval(interval);
  }, [latitude, longitude, associatedHospitalPos, emit]);

  const toggleDuty = async () => {
    setTogglingDuty(true);
    try {
      const activeLat = associatedHospitalPos?.lat ?? latitude ?? undefined;
      const activeLng = associatedHospitalPos?.lng ?? longitude ?? undefined;
      const res = await ambulanceAPI.toggleDuty(activeLat, activeLng);
      setProfile(res.data.data);
      setToast({ message: `Duty status: ${res.data.data.dutyStatus}`, type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to toggle duty', type: 'error' });
    } finally {
      setTogglingDuty(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!currentEmergency) return;
    setUpdatingStatus(true);
    try {
      await ambulanceAPI.updateStatus(status, { emergencyId: currentEmergency._id });
      setToast({ message: `Status updated to ${status.replace(/_/g, ' ')}`, type: 'success' });

      if (status === 'picked_up') {
        setNavPhase('to_hospital');
        emit('ambulance:phase-change', {
          emergencyId: currentEmergency._id,
          phase: 'to_hospital',
          ambulanceId: profile?._id,
          destination: hospitalPos,
        });
      }

      fetchData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <PageLoader />;

  const ambulancePos = associatedHospitalPos
    ? associatedHospitalPos
    : latitude && longitude
      ? { lat: latitude, lng: longitude }
      : null;
  const mapAmbulancePos = DEMO_MODE
    ? demoSimulation.position || demoStartPos
    : ambulancePos;
  const mapPatientPos = DEMO_MODE ? demoPatientPos : patientPos;
  const mapHospitalPos = DEMO_MODE ? demoHospitalPos : hospitalPos;
  const mapPhase = DEMO_MODE ? demoSimulation.phase : navPhase;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ambulance Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage your duty and emergency responses</p>
        </div>
        <Button
          onClick={toggleDuty}
          loading={togglingDuty}
          variant={profile?.dutyStatus === 'on_duty' ? 'danger' : 'success'}
          icon={<Power className="h-4 w-4" />}
        >
          {profile?.dutyStatus === 'on_duty' ? 'Go Off Duty' : 'Go On Duty'}
        </Button>
      </div>

      {/* Location Status */}
      {ambulancePos && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Location sharing active: {ambulancePos.lat.toFixed(4)}, {ambulancePos.lng.toFixed(4)}
        </div>
      )}

      {/* Current Emergency with Live Map */}
      {currentEmergency ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger-600">
                <AlertTriangle className="h-5 w-5" />
                Active Emergency
                <Badge status={currentEmergency.status} />
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Patient</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {currentEmergency.patientName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Condition</p>
                  <Badge status={currentEmergency.patientCondition} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Caller Phone</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {currentEmergency.callerPhone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Hospital</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {currentEmergency.assignedHospital?.hospitalName || 'Not assigned'}
                  </p>
                </div>
              </div>

              {currentEmergency.description && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {currentEmergency.description}
                </div>
              )}

              {/* Status Actions */}
              <div className="flex items-center gap-3 pt-2">
                {['assigned', 'ambulance_dispatched'].includes(currentEmergency.status) && (
                  <Button
                    onClick={() => updateStatus('picked_up')}
                    loading={updatingStatus}
                    variant="primary"
                    icon={<Truck className="h-4 w-4" />}
                  >
                    Patient Picked Up
                  </Button>
                )}
                {currentEmergency.status === 'patient_picked_up' && (
                  <Button
                    onClick={() => updateStatus('reached_hospital')}
                    loading={updatingStatus}
                    variant="success"
                    icon={<Building2 className="h-4 w-4" />}
                  >
                    Reached Hospital
                  </Button>
                )}
                {currentEmergency.status === 'reached_hospital' && (
                  <Button
                    onClick={() => updateStatus('completed')}
                    loading={updatingStatus}
                    variant="success"
                    icon={<CheckCircle className="h-4 w-4" />}
                  >
                    Transfer Complete
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Live Navigation Map */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary-600" />
                  Live Navigation
                </CardTitle>
                {DEMO_MODE && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={demoSimulation.isRunning ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={demoSimulation.isRunning ? demoSimulation.stop : demoSimulation.start}
                    >
                      {demoSimulation.isRunning ? 'Stop Demo' : 'Start Demo'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={demoSimulation.reset}>
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <div className="px-6 pb-6">
              <LiveTrackingMap
                ambulancePosition={mapAmbulancePos}
                patientPosition={mapPatientPos}
                hospitalPosition={mapHospitalPos}
                phase={mapPhase}
                extraMarkers={DEMO_MODE ? TRAFFIC_MARKERS : []}
                showDirections={true}
                showPatientToHospitalRoute={true}
                height="400px"
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active emergency</p>
            <p className="text-sm text-gray-400 mt-1">You will be notified when a new emergency is assigned</p>
          </div>
        </Card>
      )}

      {/* Past Emergencies */}
      <Card>
        <CardHeader>
          <CardTitle>My Emergencies</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hospital</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {myEmergencies.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No emergency history</td></tr>
              ) : (
                myEmergencies.map((e: any) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{e.patientName || 'Unknown'}</td>
                    <td className="py-3 px-4"><Badge status={e.patientCondition} /></td>
                    <td className="py-3 px-4"><Badge status={e.status} /></td>
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedHospital?.hospitalName || '-'}</td>
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
    </div>
  );
}
