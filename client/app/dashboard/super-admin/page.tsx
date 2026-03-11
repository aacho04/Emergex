'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Ambulance as AmbulanceIcon,
  Building2,
  Shield,
  AlertTriangle,
  Heart,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { userAPI, emergencyAPI } from '@/services/api';
import { formatDate, formatStatusText } from '@/utils/helpers';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [emergencyStats, setEmergencyStats] = useState<any>(null);
  const [recentEmergencies, setRecentEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userStatsRes, eStatsRes, emergenciesRes] = await Promise.all([
          userAPI.getStats(),
          emergencyAPI.getStats(),
          emergencyAPI.getAll(),
        ]);
        setStats(userStatsRes.data.data);
        setEmergencyStats(eStatsRes.data.data);
        setRecentEmergencies(emergenciesRes.data.data?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of the entire Emergex system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="ERS Officers"
          value={stats?.ersOfficers || 0}
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Ambulances"
          value={stats?.ambulances || 0}
          icon={<AmbulanceIcon className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Hospitals"
          value={stats?.hospitals || 0}
          icon={<Building2 className="h-6 w-6" />}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Traffic Police"
          value={stats?.trafficPolice || 0}
          icon={<Shield className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Total Emergencies"
          value={emergencyStats?.total || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Active Emergencies"
          value={emergencyStats?.active || 0}
          icon={<Activity className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={emergencyStats?.completed || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Recent Emergencies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emergencies</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                    No emergencies recorded yet
                  </td>
                </tr>
              ) : (
                recentEmergencies.map((emergency: any) => (
                  <tr key={emergency._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {emergency.patientName || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={emergency.patientCondition} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={emergency.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(emergency.createdAt)}
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
