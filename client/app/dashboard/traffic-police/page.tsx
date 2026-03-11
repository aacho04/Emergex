'use client';

import { useEffect, useState, useCallback } from 'react';
import { Power, Navigation, Shield, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { trafficPoliceAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useLocationStore } from '@/store/locationStore';
import { formatDate, formatTime } from '@/utils/helpers';

export default function TrafficPoliceDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { emit, on, off } = useSocket();
  const { latitude, longitude, requestLocation } = useLocationStore();

  const fetchData = useCallback(async () => {
    try {
      const profileRes = await trafficPoliceAPI.getMe();
      setProfile(profileRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    requestLocation();
  }, [fetchData, requestLocation]);

  // Listen for incoming emergency route alerts
  useEffect(() => {
    const handleAlert = (data: any) => {
      setAlerts((prev) => [data, ...prev]);
      setToast({ message: 'New route clearance alert received!', type: 'success' });
    };

    on('traffic:route-alert', handleAlert);
    on('emergency:assigned', handleAlert);

    return () => {
      off('traffic:route-alert', handleAlert);
      off('emergency:assigned', handleAlert);
    };
  }, [on, off]);

  // Share location periodically
  useEffect(() => {
    if (!latitude || !longitude) return;

    const interval = setInterval(() => {
      emit('traffic:update-location', { latitude, longitude });
    }, 15000); // every 15 seconds

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
    } finally { setTogglingDuty(false); }
  };

  const clearAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
    emit('traffic:cleared', { alertIndex: index });
  };

  if (loading) return <PageLoader />;

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

      {/* Profile Card */}
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
              {alerts.map((alert: any, index: number) => (
                <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-sm text-gray-900">Emergency Route Alert</span>
                    </div>
                    <Button size="sm" variant="success" onClick={() => clearAlert(index)}>
                      Route Cleared
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {alert.patientName ? `Patient: ${alert.patientName}` : 'Emergency in progress'}
                    {alert.patientCondition && ` - Condition: ${alert.patientCondition}`}
                  </p>
                  {alert.ambulanceVehicle && (
                    <p className="text-xs text-gray-500 mt-1">Ambulance: {alert.ambulanceVehicle}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
