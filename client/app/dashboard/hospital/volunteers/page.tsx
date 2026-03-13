'use client';

import { useEffect, useState } from 'react';
import { Star, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { volunteerAPI } from '@/services/api';

export default function HospitalVolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; volunteerId: string; name: string }>({
    open: false, volunteerId: '', name: '',
  });
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchVolunteers = async () => {
    try {
      const res = await volunteerAPI.getAll();
      setVolunteers(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVolunteers(); }, []);

  const submitRating = async () => {
    if (selectedRating === 0) return;
    setSubmittingRating(true);
    try {
      await volunteerAPI.rate(ratingModal.volunteerId, { rating: selectedRating });
      setToast({ message: 'Rating submitted successfully', type: 'success' });
      setRatingModal({ open: false, volunteerId: '', name: '' });
      setSelectedRating(0);
      fetchVolunteers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to rate', type: 'error' });
    } finally { setSubmittingRating(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Volunteers</h2>
        <p className="text-gray-500 mt-1">View and rate volunteers (sorted by rating)</p>
      </div>

      {volunteers.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No volunteers found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((v: any) => {
            const displayName = v.name || v.fullName || 'Volunteer';
            return (
              <Card key={v._id}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-gray-900">{v.averageRating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{v.phone}</p>
                  {v.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {v.skills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${v.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                      {v.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRatingModal({ open: true, volunteerId: v._id, name: displayName });
                        setSelectedRating(0);
                      }}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" /> Rate
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      <Modal isOpen={ratingModal.open} onClose={() => setRatingModal({ open: false, volunteerId: '', name: '' })} title={`Rate ${ratingModal.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">How would you rate this volunteer&apos;s service?</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= selectedRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {selectedRating > 0 && (
            <p className="text-center text-sm font-medium text-gray-700">
              {selectedRating === 1 && 'Poor'}
              {selectedRating === 2 && 'Fair'}
              {selectedRating === 3 && 'Good'}
              {selectedRating === 4 && 'Very Good'}
              {selectedRating === 5 && 'Excellent'}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setRatingModal({ open: false, volunteerId: '', name: '' })}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={submitRating} loading={submittingRating} disabled={selectedRating === 0} className="flex-1">
              Submit Rating
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
