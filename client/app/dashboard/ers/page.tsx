'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Ambulance, Building2, Activity, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { emergencyAPI } from '@/services/api';
import { formatDate, formatTime } from '@/utils/helpers';
import Link from 'next/link';

export default function ERSDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, emergenciesRes] = await Promise.all([
          emergencyAPI.getStats(),
          emergencyAPI.getAll(),
        ]);
        setStats(statsRes.data.data);
        setEmergencies((emergenciesRes.data.data || []).slice(0, 10));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ERS Dashboard</h2>
          <p className="text-gray-500 mt-1">Emergency Response System overview</p>
        </div>
        <Link href="/dashboard/ers/new-emergency">
          <Button icon={<AlertTriangle className="h-4 w-4" />}>New Emergency</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Emergencies" value={stats?.total || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Active" value={stats?.active || 0} icon={Activity} color="warning" />
        <StatCard title="In Progress" value={(stats?.assigned || 0) + (stats?.picked_up || 0) + (stats?.en_route || 0)} icon={Clock} color="primary" />
        <StatCard title="Completed" value={stats?.completed || 0} icon={CheckCircle} color="success" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Emergencies</CardTitle>
            <Link href="/dashboard/ers/emergencies">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ambulance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No emergencies yet</td></tr>
              ) : (
                emergencies.map((e: any) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{e.patientName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{e.patientAge ? `${e.patientAge} yrs` : ''}</div>
                    </td>
                    <td className="py-3 px-4"><Badge status={e.patientCondition} /></td>
                    <td className="py-3 px-4"><Badge status={e.status} /></td>
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedAmbulance?.vehicleNumber || '-'}</td>
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
