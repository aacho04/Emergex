'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { emergencyAPI } from '@/services/api';
import { formatDate, formatTime } from '@/utils/helpers';
import Link from 'next/link';

const COMPLETED_STATUSES = ['completed', 'cancelled'];

export default function ERSEmergenciesPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEmergency, setEditEmergency] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    callerPhone: '',
    patientName: '',
    patientCondition: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const res = await emergencyAPI.getAll();
      setEmergencies(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openEdit = (e: any) => {
    setEditEmergency(e);
    setEditForm({
      callerPhone: e.callerPhone || '',
      patientName: e.patientName || '',
      patientCondition: e.patientCondition || 'serious',
      description: e.description || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editEmergency) return;
    setSaving(true);
    try {
      await emergencyAPI.update(editEmergency._id, editForm);
      setToast({ message: 'Emergency updated successfully', type: 'success' });
      setEditModalOpen(false);
      setEditEmergency(null);
      // Refresh list
      const res = await emergencyAPI.getAll();
      setEmergencies(res.data.data || []);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to update emergency', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? emergencies : emergencies.filter((e: any) => e.status === filter);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emergencies</h2>
          <p className="text-gray-500 mt-1">Manage all emergency dispatches</p>
        </div>
        <Link href="/dashboard/ers/new-emergency">
          <Button icon={<AlertTriangle className="h-4 w-4" />}>New Emergency</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pending', 'assigned', 'ambulance_dispatched', 'patient_picked_up', 'en_route_hospital', 'reached_hospital', 'completed', 'cancelled'].map((s) => (
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                    <td className="py-3 px-4 text-sm text-gray-600">{e.assignedHospital?.name || e.assignedHospital?.hospitalName || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{formatDate(e.createdAt)}</div>
                      <div className="text-xs text-gray-400">{formatTime(e.createdAt)}</div>
                    </td>
                    <td className="py-3 px-4">
                      {!COMPLETED_STATUSES.includes(e.status) && (
                        <button
                          onClick={() => openEdit(e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Emergency Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Emergency">
        <div className="space-y-4">
          <Input
            label="Caller Phone"
            value={editForm.callerPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditForm({ ...editForm, callerPhone: e.target.value })
            }
            type="tel"
            placeholder="Phone number"
          />
          <Input
            label="Patient Name"
            value={editForm.patientName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditForm({ ...editForm, patientName: e.target.value })
            }
            placeholder="Patient name"
          />
          <Select
            label="Patient Condition"
            value={editForm.patientCondition}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEditForm({ ...editForm, patientCondition: e.target.value })
            }
            options={[
              { value: 'critical', label: 'Critical - Life threatening' },
              { value: 'serious', label: 'Serious - Needs urgent care' },
              { value: 'moderate', label: 'Moderate - Stable but needs attention' },
              { value: 'minor', label: 'Minor - Non-critical' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Describe the emergency..."
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSaveEdit} loading={saving} className="flex-1">
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
