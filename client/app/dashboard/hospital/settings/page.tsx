'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import MapPicker from '@/components/maps/MapPicker';
import { hospitalAPI } from '@/services/api';
import { useRouter } from 'next/navigation';

export default function HospitalSettingsPage() {
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    hospitalName: '', address: '', phone: '',
    totalBeds: 0, availableBeds: 0,
    specialties: '',
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await hospitalAPI.getMe();
        const h = res.data.data;
        setHospital(h);
        setForm({
          hospitalName: h.hospitalName || h.name || '',
          address: h.address || '',
          phone: h.phone || '',
          totalBeds: h.totalBeds || 0,
          availableBeds: h.availableBeds || 0,
          specialties: (h.specialties || []).join(', '),
          latitude: h.location?.coordinates?.[1] || 0,
          longitude: h.location?.coordinates?.[0] || 0,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.availableBeds) > Number(form.totalBeds)) {
      setToast({ message: 'Available beds cannot exceed total beds', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const hasValidLocation = Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
        && form.latitude !== 0 && form.longitude !== 0;
      await hospitalAPI.update({
        ...form,
        totalBeds: Number(form.totalBeds),
        availableBeds: Number(form.availableBeds),
        specialties: form.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        location: hasValidLocation
          ? { type: 'Point', coordinates: [form.longitude, form.latitude] }
          : undefined,
      });
      setToast({ message: 'Hospital settings updated', type: 'success' });
      setTimeout(() => router.push('/dashboard/hospital'), 1000);
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to update', type: 'error' });
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hospital Settings</h2>
        <p className="text-gray-500 mt-1">Update your hospital profile and capacity</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Hospital Information</CardTitle></CardHeader>
          <div className="px-6 pb-6 space-y-4">
            <Input
              label="Hospital Name"
              value={form.hospitalName}
              onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Beds"
                type="number"
                value={form.totalBeds}
                onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })}
              />
              <Input
                label="Available Beds"
                type="number"
                value={form.availableBeds}
                onChange={(e) => setForm({ ...form, availableBeds: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder="Enter specialties separated by commas (e.g., Cardiology, Neurology, Orthopedics)"
                value={form.specialties}
                onChange={(e) => setForm({ ...form, specialties: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">Separate specialties with commas</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Hospital Location</p>
              <p className="text-xs text-gray-400">
                Search or click on the map to update the hospital location.
              </p>
              <MapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onLocationChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                onAddressFound={(address) => setForm({ ...form, address })}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
