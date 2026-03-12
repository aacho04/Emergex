'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { emergencyAPI } from '@/services/api';
import { formatDate, formatTime } from '@/utils/helpers';

export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const matchesFilter = (emergency: any, value: string) => {
    if (value === 'all') return true;
    if (value === 'active') {
      return !['completed', 'cancelled'].includes(emergency.status);
    }
    if (value === 'picked_up') {
      return emergency.status === 'patient_picked_up';
    }
    if (value === 'en_route') {
      return emergency.status === 'en_route_hospital';
    }
    return emergency.status === value;
  };

  const fetchEmergencies = async () => {
    try {
      const res = await emergencyAPI.getAll();
      setEmergencies(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmergencies(); }, []);

  const filtered = emergencies.filter((e: any) => matchesFilter(e, filter));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Emergencies</h2>
        <p className="text-gray-500 mt-1">All emergency records</p>
      </div>

      <div className="flex items-center gap-2">
        {['all', 'active', 'assigned', 'picked_up', 'en_route', 'reached_hospital', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ambulance</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hospital</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Created By</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No emergencies found</td></tr>
              ) : (
                filtered.map((e: any) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{e.patientName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{e.callerPhone || ''}</div>
                    </td>
                    <td className="py-3 px-4"><Badge status={e.patientCondition} /></td>
                    <td className="py-3 px-4"><Badge status={e.status} /></td>
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedAmbulance?.vehicleNumber || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedHospital?.hospitalName || e.assignedHospital?.name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedBy?.fullName || '-'}</td>
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
