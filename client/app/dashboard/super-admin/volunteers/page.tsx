'use client';

import { useEffect, useState } from 'react';
import { Star, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { volunteerAPI } from '@/services/api';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await volunteerAPI.getAll();
        setVolunteers(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Volunteers</h2>
        <p className="text-gray-500 mt-1">All registered volunteers sorted by rating</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Skills</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Available</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No volunteers found</td></tr>
              ) : (
                volunteers.map((v: any) => (
                  <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{v.fullName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{v.phone}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(v.skills || []).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-gray-900">{v.averageRating?.toFixed(1) || '0.0'}</span>
                        <span className="text-xs text-gray-400">({v.ratings?.length || 0})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        v.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {v.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
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
