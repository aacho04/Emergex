'use client';

import { useEffect, useState } from 'react';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hospitalAPI } from '@/services/api';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchHospitals = async () => {
    try {
      const res = await hospitalAPI.getAllAdmin();
      setHospitals(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleVerify = async (id: string) => {
    try {
      await hospitalAPI.verify(id);
      setToast({ message: 'Hospital verified successfully', type: 'success' });
      fetchHospitals();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to verify', type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hospitals</h2>
        <p className="text-gray-500 mt-1">View and verify registered hospitals</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hospital Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Address</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Beds</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email Verified</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Verified</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">No hospitals found</td></tr>
              ) : (
                hospitals.map((h: any) => (
                  <tr key={h._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{h.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-[200px] truncate">{h.address}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{h.phone}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{h.totalBeds}</td>
                    <td className="py-3 px-4">
                      {h.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><XCircle className="h-3.5 w-3.5" /> Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {h.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><XCircle className="h-3.5 w-3.5" /> Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!h.isVerified && (
                        <Button size="sm" variant="success" onClick={() => handleVerify(h._id)}>Verify</Button>
                      )}
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
