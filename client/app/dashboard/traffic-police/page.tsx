'use client';

import { useEffect, useState, useCallback } from 'react';
import { Power, Navigation, Shield, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import LiveTrackingMap, { MapMarker } from '@/components/maps/LiveTrackingMap';
import { trafficPoliceAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useLocationStore } from '@/store/locationStore';

interface RouteAlert {
  emergencyId: string;
  message: string;
  phase?: string;
  ambulanceId?: string;
  ambulanceLocation?: { lat: number; lng: number };
  patientLocation?: { lat: number; lng: number };
  hospitalLocation?: { lat: number; lng: number };
  trafficPoliceIds?: string[];
  timestamp: number;
}

export default function TrafficPoliceDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [liveAmbulancePositions, setLiveAmbulancePositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const { emit, on, off } = useSocket();
  const { latitude, longitude, requestLocation } = useLocationStore();

  const fetchData = useCallback(async () => {
    try {
      const profileRes = await trafficPoliceAPI.getMe();
      setProfile(profileRes.data.data);
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

  // Listen for incoming emergency route alerts
  useEffect(() => {
    const handleRouteAlert = (data: any) => {
      const alert: RouteAlert = {
        ...data,
        timestamp: Date.now(),
      };
      setAlerts((prev) => [alert, ...prev]);
      setToast({ message: 'New route clearance alert received!', type: 'success' });

      // Track ambulance position from the alert
      if (data.ambulanceId && data.ambulanceLocation) {
        setLiveAmbulancePositions((prev) => ({
          ...prev,
          [data.ambulanceId]: data.ambulanceLocation,
        }));
      }
    };

    const handleAmbulanceLocation = (data: any) => {
      if (data.ambulanceId) {
        setLiveAmbulancePositions((prev) => ({
          ...prev,
          [data.ambulanceId]: data.location,
        }));
      }
    };

    on('traffic:route-alert', handleRouteAlert);
    on('ambulance:location', handleAmbulanceLocation);

    return () => {
      off('traffic:route-alert', handleRouteAlert);
      off('ambulance:location', handleAmbulanceLocation);
    };
  }, [on, off]);

  // Share location periodically
  useEffect(() => {
    if (!latitude || !longitude) return;

    const interval = setInterval(() => {
      emit('traffic:update-location', { lat: latitude, lng: longitude });
    }, 15000);

    return () => clearInterval(interval);
  }, [latitude, longitude, emit]);

  const toggleDuty = async () => {
    setTogglingDuty(true);
    try {
      const res = await trafficPoliceAPI.toggleDuty();
      setProfile(res.data.data);
      setToast({ message: `Duty status: ${res.data.data.dutyStatus}`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to toggle duty', type: 'error' });
    } finally {
      setTogglingDuty(false);
    }
  };

  const clearAlert = (index: number) => {
    const alert = alerts[index];
    setAlerts((prev) => prev.filter((_, i) => i !== index));
    emit('traffic:cleared', { emergencyId: alert?.emergencyId });
  };

  if (loading) return <PageLoader />;

  // Get the most recent active alert for the map view
  const activeAlert = alerts[0] || null;
  const activeAmbulancePos = activeAlert?.ambulanceId
    ? liveAmbulancePositions[activeAlert.ambulanceId] || activeAlert.ambulanceLocation
    : null;

  // Build extra markers for map
  const mapMarkers: MapMarker[] = [];
  if (latitude && longitude) {
    mapMarkers.push({
      id: 'me',
      position: { lat: latitude, lng: longitude },
      label: 'You',
      type: 'traffic',
    });
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Traffic Police Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage duty and route clearance alerts</p>
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

      {/* Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{profile?.userId?.fullName || 'Officer'}</p>
                <p className="text-xs text-gray-500">Badge: {profile?.badgeNumber}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Assigned Area</p>
                <p className="text-xs text-gray-500">{profile?.assignedArea || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                profile?.dutyStatus === 'on_duty' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Power className={`h-5 w-5 ${
                  profile?.dutyStatus === 'on_duty' ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Duty Status</p>
                <p className={`text-xs font-medium ${
                  profile?.dutyStatus === 'on_duty' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {profile?.dutyStatus === 'on_duty' ? 'On Duty' : 'Off Duty'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Location Status */}
      {latitude && longitude && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Location sharing active: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      )}

      {/* Live Route Map */}
      {activeAlert && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary-600" />
              Live Ambulance Route
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <LiveTrackingMap
              ambulancePosition={activeAmbulancePos}
              patientPosition={activeAlert.patientLocation || null}
              hospitalPosition={activeAlert.hospitalLocation || null}
              phase={activeAlert.phase === 'to_hospital' ? 'to_hospital' : 'to_patient'}
              extraMarkers={mapMarkers}
              showDirections={true}
              height="350px"
            />
          </div>
        </Card>
      )}

      {/* Route Clearance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Route Clearance Alerts
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active alerts</p>
              <p className="text-sm text-gray-400 mt-1">Route clearance alerts will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={`${alert.emergencyId}-${alert.timestamp}`} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-sm text-gray-900">
                        {alert.phase === 'to_hospital' ? 'Hospital Route Alert' : 'Emergency Route Alert'}
                      </span>
                      {alert.phase && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          alert.phase === 'to_hospital'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {alert.phase === 'to_hospital' ? 'Phase 2: To Hospital' : 'Phase 1: To Patient'}
                        </span>
                      )}
                    </div>
                    <Button size="sm" variant="success" onClick={() => clearAlert(index)}>
                      Route Cleared
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
