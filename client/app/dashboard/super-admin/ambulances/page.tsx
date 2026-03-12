'use client';

import { useEffect, useState } from 'react';
import { Plus, Ambulance as AmbulanceIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { authAPI, ambulanceAPI, hospitalAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAmbulanceSchema, CreateAmbulanceFormData } from '@/utils/validators';
import { Select } from '@/components/ui/Select';

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<CreateAmbulanceFormData>({ resolver: zodResolver(createAmbulanceSchema) });

  const fetchAmbulances = async () => {
    try {
      const res = await ambulanceAPI.getAll();
      setAmbulances(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchHospitals = async () => {
    try {
      const res = await hospitalAPI.getAllAdmin();
      setHospitals(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchAmbulances();
    fetchHospitals();
  }, []);

  const onSubmit = async (data: CreateAmbulanceFormData) => {
    try {
      await authAPI.createAmbulance(data);
      setToast({ message: 'Ambulance created successfully', type: 'success' });
      setModalOpen(false);
      reset();
      fetchAmbulances();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create', type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ambulances</h2>
          <p className="text-gray-500 mt-1">Manage ambulance units</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Add Ambulance
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hospital</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Duty</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {ambulances.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No ambulances found</td></tr>
              ) : (
                ambulances.map((amb: any) => (
                  <tr key={amb._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{amb.vehicleNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{amb.driverName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{amb.driverPhone}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{amb.hospital?.hospitalName || '-'}</td>
                    <td className="py-3 px-4"><Badge status={amb.dutyStatus} /></td>
                    <td className="py-3 px-4"><Badge status={amb.ambulanceStatus} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Ambulance">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Associated Hospital"
            placeholder="Select a hospital"
            error={errors.hospitalId?.message}
            options={hospitals.map((h) => ({
              value: h._id,
              label: h.hospitalName || h.name || 'Hospital',
            }))}
            {...register('hospitalId')}
          />
          <Input label="Full Name" placeholder="Account holder name" error={errors.fullName?.message} {...register('fullName')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Username" placeholder="Login username" error={errors.username?.message} {...register('username')} />
            <Input label="Password" type="password" placeholder="Password" error={errors.password?.message} {...register('password')} />
          </div>
          <Input label="Phone" placeholder="Phone number" error={errors.phone?.message} {...register('phone')} />
          <Input label="Vehicle Number" placeholder="e.g., KA-01-AB-1234" error={errors.vehicleNumber?.message} {...register('vehicleNumber')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Driver Name" placeholder="Driver name" error={errors.driverName?.message} {...register('driverName')} />
            <Input label="Driver Phone" placeholder="Driver phone" error={errors.driverPhone?.message} {...register('driverPhone')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Create Ambulance</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
