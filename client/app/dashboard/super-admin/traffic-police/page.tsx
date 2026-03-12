'use client';

import { useEffect, useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { authAPI, trafficPoliceAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTrafficPoliceSchema, CreateTrafficPoliceFormData } from '@/utils/validators';

export default function TrafficPolicePage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTrafficPoliceFormData>({
    resolver: zodResolver(createTrafficPoliceSchema),
  });

  const fetchOfficers = async () => {
    try {
      const res = await trafficPoliceAPI.getAll();
      setOfficers(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOfficers(); }, []);

  const onSubmit = async (data: CreateTrafficPoliceFormData) => {
    try {
      await authAPI.createTrafficPolice(data);
      setToast({ message: 'Traffic police created successfully', type: 'success' });
      setModalOpen(false);
      reset();
      fetchOfficers();
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
          <h2 className="text-2xl font-bold text-gray-900">Traffic Police</h2>
          <p className="text-gray-500 mt-1">Manage traffic police officers</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Add Officer
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Badge Number</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Area</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Duty Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No traffic police found</td></tr>
              ) : (
                officers.map((tp: any) => (
                  <tr key={tp._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{tp.user?.fullName || tp.fullName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{tp.badgeNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{tp.assignedArea}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{tp.user?.phone || tp.phone}</td>
                    <td className="py-3 px-4"><Badge status={tp.dutyStatus} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Traffic Police Officer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" placeholder="Officer full name" error={errors.fullName?.message} {...register('fullName')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Username" placeholder="Login username" error={errors.username?.message} {...register('username')} />
            <Input label="Password" type="password" placeholder="Password" error={errors.password?.message} {...register('password')} />
          </div>
          <Input label="Phone" placeholder="Phone number" error={errors.phone?.message} {...register('phone')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Badge Number" placeholder="Badge number" error={errors.badgeNumber?.message} {...register('badgeNumber')} />
            <Input label="Assigned Area" placeholder="Area / Zone" error={errors.assignedArea?.message} {...register('assignedArea')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Create Officer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
