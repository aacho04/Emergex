'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hospitalAPI } from '@/services/api';

export default function HospitalSettingsPage() {
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '', address: '', phone: '',
    totalBeds: 0, availableBeds: 0,
    specialties: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await hospitalAPI.getMe();
        const h = res.data.data;
        setHospital(h);
        setForm({
          name: h.name || '',
          address: h.address || '',
          phone: h.phone || '',
          totalBeds: h.totalBeds || 0,
          availableBeds: h.availableBeds || 0,
          specialties: (h.specialties || []).join(', '),
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
      await hospitalAPI.update({
        ...form,
        totalBeds: Number(form.totalBeds),
        availableBeds: Number(form.availableBeds),
        specialties: form.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      setToast({ message: 'Hospital settings updated', type: 'success' });
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
