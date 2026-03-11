'use client';

import { useEffect, useState, useCallback } from 'react';
import { Power, MapPin, Navigation, AlertTriangle, Truck, Building2, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ambulanceAPI, emergencyAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { useLocationStore } from '@/store/locationStore';
import { formatDate, formatTime } from '@/utils/helpers';

export default function AmbulanceDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [currentEmergency, setCurrentEmergency] = useState<any>(null);
  const [myEmergencies, setMyEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { emit } = useSocket();
  const { latitude, longitude, requestLocation } = useLocationStore();

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, emergenciesRes] = await Promise.all([
        ambulanceAPI.getAll(), // We'll filter own profile from list or use a dedicated endpoint
        emergencyAPI.getMy(),
      ]);
      const ambulances = profileRes.data.data || [];
      // The first ambulance matching our user - backend will handle filtering
      setMyEmergencies(emergenciesRes.data.data || []);
      
      // Find current active emergency
      const active = (emergenciesRes.data.data || []).find(
        (e: any) => ['assigned', 'picked_up', 'en_route'].includes(e.status)
      );
      setCurrentEmergency(active || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    requestLocation();
  }, [fetchData, requestLocation]);

  // Share location periodically
  useEffect(() => {
    if (!latitude || !longitude) return;
    
    const interval = setInterval(() => {
      emit('ambulance:update-location', { latitude, longitude });
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, [latitude, longitude, emit]);

  const toggleDuty = async () => {
    setTogglingDuty(true);
    try {
      const res = await ambulanceAPI.toggleDuty();
      setProfile(res.data.data);
      setToast({ message: `Duty status: ${res.data.data.dutyStatus}`, type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to toggle duty', type: 'error' });
    } finally { setTogglingDuty(false); }
  };

  const updateStatus = async (status: string) => {
    if (!currentEmergency) return;
    setUpdatingStatus(true);
    try {
      await ambulanceAPI.updateStatus(status);
      setToast({ message: `Status updated to ${status.replace(/_/g, ' ')}`, type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' });
    } finally { setUpdatingStatus(false); }
  };

  if (loading) return <PageLoader />;

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
      {latitude && longitude && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Location sharing active: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      )}

      {/* Current Emergency */}
      {currentEmergency ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
              Active Emergency
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Patient</p>
                <p className="text-sm font-semibold text-gray-900">{currentEmergency.patientName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Condition</p>
                <Badge status={currentEmergency.patientCondition} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                <Badge status={currentEmergency.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Hospital</p>
                <p className="text-sm text-gray-900">{currentEmergency.assignedHospital?.name || 'Not assigned'}</p>
              </div>
            </div>

            {currentEmergency.description && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {currentEmergency.description}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {currentEmergency.status === 'assigned' && (
                <Button
                  onClick={() => updateStatus('picked_up')}
                  loading={updatingStatus}
                  variant="primary"
                  icon={<Truck className="h-4 w-4" />}
                >
                  Patient Picked Up
                </Button>
              )}
              {currentEmergency.status === 'picked_up' && (
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
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedHospital?.name || '-'}</td>
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
