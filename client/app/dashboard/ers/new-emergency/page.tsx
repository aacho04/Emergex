'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, MapPin, Ambulance, Building2, Shield, Navigation } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { emergencyAPI, ambulanceAPI, hospitalAPI, trafficPoliceAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emergencyFormSchema, EmergencyFormData } from '@/utils/validators';
import { formatDistance } from '@/utils/helpers';

export default function NewEmergencyPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAmbulances, setNearbyAmbulances] = useState<any[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [nearbyTraffic, setNearbyTraffic] = useState<any[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedTraffic, setSelectedTraffic] = useState<string[]>([]);
  const [fetchingNearby, setFetchingNearby] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencyFormSchema),
  });

  // Fetch nearby resources when location is set
  useEffect(() => {
    if (!location) return;

    const fetchNearby = async () => {
      setFetchingNearby(true);
      try {
        const [ambRes, hospRes, trafficRes] = await Promise.all([
          ambulanceAPI.getNearby(location.lat, location.lng),
          hospitalAPI.getNearby(location.lat, location.lng),
          trafficPoliceAPI.getNearby(location.lat, location.lng),
        ]);
        setNearbyAmbulances(ambRes.data.data || []);
        setNearbyHospitals(hospRes.data.data || []);
        setNearbyTraffic(trafficRes.data.data || []);
      } catch (err) { console.error(err); }
      finally { setFetchingNearby(false); }
    };
    fetchNearby();
  }, [location]);

  const toggleTraffic = (id: string) => {
    setSelectedTraffic((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: EmergencyFormData) => {
    if (!location) {
      setToast({ message: 'Please pick the emergency location', type: 'error' });
      return;
    }
    if (!selectedAmbulance) {
      setToast({ message: 'Please select an ambulance', type: 'error' });
      return;
    }

    try {
      await emergencyAPI.create({
        ...data,
        location: { type: 'Point', coordinates: [location.lng, location.lat] },
        assignedAmbulance: selectedAmbulance,
        assignedHospital: selectedHospital || undefined,
        assignedTrafficPolice: selectedTraffic.length > 0 ? selectedTraffic : undefined,
      });

      setToast({ message: 'Emergency created successfully!', type: 'success' });
      setTimeout(() => router.push('/dashboard/ers/emergencies'), 1500);
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create emergency', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Emergency</h2>
        <p className="text-gray-500 mt-1">Create a new emergency dispatch</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Patient Name" placeholder="Patient name" error={errors.patientName?.message} {...register('patientName')} />
              <Input label="Age" type="number" placeholder="Age" error={errors.patientAge?.message} {...register('patientAge', { valueAsNumber: true })} />
              <Select
                label="Gender"
                error={errors.patientGender?.message}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                {...register('patientGender')}
              />
            </div>
            <Select
              label="Patient Condition"
              error={errors.patientCondition?.message}
              options={[
                { value: 'critical', label: 'Critical - Life threatening' },
                { value: 'serious', label: 'Serious - Needs urgent care' },
                { value: 'moderate', label: 'Moderate - Stable but needs attention' },
                { value: 'minor', label: 'Minor - Non-critical' },
              ]}
              {...register('patientCondition')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder="Describe the emergency situation..."
                {...register('description')}
              />
            </div>
            <Input label="Caller Phone" placeholder="Contact phone number" error={errors.callerPhone?.message} {...register('callerPhone')} />
          </div>
        </Card>

        {/* Emergency Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-danger-500" />
              Emergency Location
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <LocationPicker
              latitude={location?.lat || 0}
              longitude={location?.lng || 0}
              onLocationChange={(lat, lng) => setLocation({ lat, lng })}
            />
            {location && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <Navigation className="h-4 w-4 inline mr-1" />
                Location set: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            )}
          </div>
        </Card>

        {/* Nearby Ambulances */}
        {location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ambulance className="h-5 w-5 text-primary-600" />
                Available Ambulances
                {fetchingNearby && <span className="text-xs text-gray-400 font-normal ml-2">Loading...</span>}
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              {nearbyAmbulances.length === 0 ? (
                <p className="text-sm text-gray-400">No available ambulances found nearby</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nearbyAmbulances.map((amb: any) => (
                    <button
                      key={amb._id}
                      type="button"
                      onClick={() => setSelectedAmbulance(amb._id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedAmbulance === amb._id
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-900">{amb.vehicleNumber}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {formatDistance(amb.distance)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Driver: {amb.driverName}</p>
                      <p className="text-xs text-gray-500">Phone: {amb.driverPhone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Nearby Hospitals */}
        {location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Nearby Hospitals
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              {nearbyHospitals.length === 0 ? (
                <p className="text-sm text-gray-400">No hospitals found nearby</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nearbyHospitals.map((h: any) => (
                    <button
                      key={h._id}
                      type="button"
                      onClick={() => setSelectedHospital(h._id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedHospital === h._id
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-900">{h.name}</span>
                        {h.distance !== undefined && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            {formatDistance(h.distance)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{h.address}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">Beds: {h.availableBeds}/{h.totalBeds}</span>
                        {h.specialties?.length > 0 && (
                          <span className="text-xs text-primary-600">{h.specialties.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Nearby Traffic Police */}
        {location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Traffic Police (Route Clearance)
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              {nearbyTraffic.length === 0 ? (
                <p className="text-sm text-gray-400">No traffic police on duty nearby</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nearbyTraffic.map((tp: any) => (
                    <button
                      key={tp._id}
                      type="button"
                      onClick={() => toggleTraffic(tp._id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTraffic.includes(tp._id)
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-900">{tp.userId?.fullName || tp.fullName}</span>
                        {tp.distance !== undefined && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            {formatDistance(tp.distance)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Badge: {tp.badgeNumber}</p>
                      <p className="text-xs text-gray-500">Area: {tp.assignedArea}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedTraffic.length > 0 && (
                <p className="mt-3 text-xs text-amber-700">
                  {selectedTraffic.length} officer(s) selected for route clearance
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" loading={isSubmitting} size="lg" className="min-w-[200px]">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Create Emergency
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
