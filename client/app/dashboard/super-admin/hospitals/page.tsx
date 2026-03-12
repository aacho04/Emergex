'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Plus, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hospitalAPI, authAPI } from '@/services/api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hospitalRegisterSchema, HospitalRegisterFormData } from '@/utils/validators';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HospitalRegisterFormData>({
    resolver: zodResolver(hospitalRegisterSchema),
    defaultValues: {
      latitude: 0,
      longitude: 0,
      totalBeds: 0,
      availableBeds: 0,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  const fetchHospitals = async () => {
    try {
      const res = await hospitalAPI.getAllAdmin();
      setHospitals(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const onSubmit = async (data: HospitalRegisterFormData) => {
    try {
      const payload = {
        ...data,
        username: data.email,
        specialties: data.specialties?.split(',').map((s) => s.trim()).filter(Boolean) || [],
      };
      await authAPI.createHospital(payload);
      setToast({ message: 'Hospital created successfully', type: 'success' });
      setModalOpen(false);
      reset({ latitude: 0, longitude: 0, totalBeds: 0, availableBeds: 0 });
      fetchHospitals();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create hospital', type: 'error' });
    }
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospitals</h2>
          <p className="text-gray-500 mt-1">View, verify, and create hospitals</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Add Hospital
        </Button>
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
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{h.hospitalName || h.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-[200px] truncate">{h.address}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{h.phone}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{h.totalBeds}</td>
                    <td className="py-3 px-4">
                      {h.user?.isEmailVerified ? (
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Hospital">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Hospital Name" placeholder="City General" error={errors.hospitalName?.message} {...register('hospitalName')} />
            <Input label="Registration Number" placeholder="Reg #" error={errors.registrationNumber?.message} {...register('registrationNumber')} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Contact Person" placeholder="Full name" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Email" type="email" placeholder="hospital@example.com" error={errors.email?.message} {...register('email')} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Phone" placeholder="Phone number" error={errors.phone?.message} {...register('phone')} />
            <Input label="Specialties" placeholder="Cardiology, Trauma" error={errors.specialties?.message} {...register('specialties')} />
          </div>

          <Input label="Address" placeholder="Full address" error={errors.address?.message} {...register('address')} />

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Total Beds" type="number" placeholder="0" error={errors.totalBeds?.message} {...register('totalBeds', { valueAsNumber: true })} />
            <Input label="Available Beds" type="number" placeholder="0" error={errors.availableBeds?.message} {...register('availableBeds', { valueAsNumber: true })} />
          </div>

          <LocationPicker
            latitude={lat}
            longitude={lng}
            onLocationChange={(newLat, newLng) => {
              setValue('latitude', newLat);
              setValue('longitude', newLng);
            }}
          />

          <Input label="Password" type="password" placeholder="Set password" error={errors.password?.message} {...register('password')} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Create Hospital</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
