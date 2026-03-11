'use client';

import { useEffect, useState } from 'react';
import { Building2, Bed, Activity, Users, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hospitalAPI } from '@/services/api';
import Link from 'next/link';

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await hospitalAPI.getMe();
        setHospital(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

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

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
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
        <StatCard title="Specialties" value={hospital.specialties?.length || 0} icon={Activity} color="warning" />
        <StatCard title="Emergency Capacity" value={hospital.emergencyCapacity || 'N/A'} icon={Building2} color="danger" />
      </div>

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
