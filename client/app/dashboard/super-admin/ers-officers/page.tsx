'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, UserCheck, UserX } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { authAPI, userAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createERSOfficerSchema, CreateERSOfficerFormData } from '@/utils/validators';
import { formatDate } from '@/utils/helpers';

export default function ERSOfficersPage() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateERSOfficerFormData>({
    resolver: zodResolver(createERSOfficerSchema),
  });

  const fetchOfficers = async () => {
    try {
      const res = await userAPI.getERSOfficers();
      setOfficers(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const onSubmit = async (data: CreateERSOfficerFormData) => {
    try {
      await authAPI.createERSOfficer(data);
      setToast({ message: 'ERS Officer created successfully', type: 'success' });
      setModalOpen(false);
      reset();
      fetchOfficers();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create', type: 'error' });
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await userAPI.deactivate(id);
      } else {
        await userAPI.activate(id);
      }
      fetchOfficers();
      setToast({ message: `Officer ${isActive ? 'deactivated' : 'activated'}`, type: 'success' });
    } catch (error: any) {
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ERS Officers</h2>
          <p className="text-gray-500 mt-1">Manage emergency response service officers</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
          Add ERS Officer
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Username</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                    No ERS officers found. Create one to get started.
                  </td>
                </tr>
              ) : (
                officers.map((officer: any) => (
                  <tr key={officer._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700">
                            {officer.fullName?.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{officer.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{officer.username}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{officer.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge status={officer.isActive ? 'on_duty' : 'off_duty'} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{formatDate(officer.createdAt)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(officer._id, officer.isActive)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {officer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Officer Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create ERS Officer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" placeholder="Enter full name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Username" placeholder="Choose a username" error={errors.username?.message} {...register('username')} />
          <Input label="Password" type="password" placeholder="Set password" error={errors.password?.message} {...register('password')} />
          <Input label="Phone (Optional)" placeholder="Phone number" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (Optional)" type="email" placeholder="Email address" error={errors.email?.message} {...register('email')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Create Officer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
