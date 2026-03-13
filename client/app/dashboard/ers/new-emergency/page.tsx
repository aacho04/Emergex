'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  AlertTriangle, MapPin, Phone, Send, Navigation, CheckCircle2,
  Ambulance, Building2, Shield, Loader2, Rocket,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';
import { emergencyAPI } from '@/services/api';
import { useSocket } from '@/hooks/useSocket';
import { formatDistance } from '@/utils/helpers';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
      Loading Google Maps...
    </div>
  ),
});

type Step = 'phone' | 'location' | 'details' | 'dispatched';

export default function NewEmergencyPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Emergency state
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('phone');

  // Phone step
  const [callerPhone, setCallerPhone] = useState('+91 ');
  const [smsSent, setSmsSent] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);

  // Location step
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationSource, setLocationSource] = useState<'sms_link' | 'manual' | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [settingLocation, setSettingLocation] = useState(false);

  // Details step
  const [patientName, setPatientName] = useState('');
  const [patientCondition, setPatientCondition] = useState('serious');
  const [description, setDescription] = useState('');

  // Dispatch
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  // Listen for real-time location from SMS link
  useEffect(() => {
    if (!socket || !emergencyId) return;

    const handleLocationReceived = (data: any) => {
      if (data.emergencyId === emergencyId) {
        setLocation({ lat: data.location.lat, lng: data.location.lng });
        setLocationConfirmed(true);
        setLocationSource(data.source);
        setToast({ message: 'Patient location received!', type: 'success' });
      }
    };

    socket.on('emergency:location-received', handleLocationReceived);
    return () => { socket.off('emergency:location-received', handleLocationReceived); };
  }, [socket, emergencyId]);

  // Step 1: Create emergency with phone number
  const normalizePhone = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length === 10) return `+91 ${digitsOnly}`;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return `+91 ${digitsOnly.slice(2)}`;
    }
    return value.trim();
  }, []);

  const handleCreateEmergency = async () => {
    const formattedPhone = normalizePhone(callerPhone);
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    const isValidPhone =
      digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91'));

    if (!formattedPhone || !isValidPhone) {
      setToast({ message: 'Please enter a valid phone number', type: 'error' });
      return;
    }

    try {
      const res = await emergencyAPI.create({
        callerPhone: formattedPhone,
        patientName: patientName || undefined,
        patientCondition,
        description: description || undefined,
      });
      setEmergencyId(res.data.data._id);
      setStep('location');
      setToast({ message: 'Emergency created. Now get the patient location.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to create emergency', type: 'error' });
    }
  };

  // Step 2a: Send SMS
  const handleSendSMS = async () => {
    if (!emergencyId) return;
    setSendingSMS(true);
    try {
      await emergencyAPI.sendLocationSMS(emergencyId);
      setSmsSent(true);
      setToast({ message: 'Location SMS sent to caller!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to send SMS', type: 'error' });
    } finally {
      setSendingSMS(false);
    }
  };

  // Step 2b: Set manual location
  const handleSetManualLocation = async () => {
    if (!emergencyId || !location) return;
    setSettingLocation(true);
    try {
      await emergencyAPI.setManualLocation(emergencyId, {
        latitude: location.lat,
        longitude: location.lng,
        address: address || undefined,
      });
      setLocationConfirmed(true);
      setLocationSource('manual');
      setToast({ message: 'Location set successfully!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Failed to set location', type: 'error' });
    } finally {
      setSettingLocation(false);
    }
  };

  // Step 3: Dispatch
  const handleDispatch = async () => {
    if (!emergencyId) return;
    setDispatching(true);
    try {
      const res = await emergencyAPI.dispatch(emergencyId);
      setDispatchResult(res.data.data);
      setStep('dispatched');
      setToast({ message: 'Emergency dispatched! Ambulance, hospital, and traffic police auto-assigned.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || 'Dispatch failed', type: 'error' });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Emergency</h2>
        <p className="text-gray-500 mt-1">Follow the steps to create and dispatch an emergency</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {(['phone', 'location', 'details', 'dispatched'] as Step[]).map((s, i) => {
          const labels = ['Phone', 'Location', 'Dispatch', 'Done'];
          const icons = [Phone, MapPin, Rocket, CheckCircle2];
          const Icon = icons[i];
          const isActive = s === step;
          const isDone =
            (s === 'phone' && step !== 'phone') ||
            (s === 'location' && locationConfirmed) ||
            (s === 'details' && step === 'dispatched') ||
            s === 'dispatched' && step === 'dispatched';

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${isDone || isActive ? 'bg-primary-500' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200' :
                isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="h-3.5 w-3.5" />
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Phone Number ── */}
      {step === 'phone' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary-600" />
              Caller Information
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 space-y-4">
            <Input
              label="Caller Phone Number *"
              placeholder="Enter caller's phone number"
              value={callerPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                if (!raw) {
                  setCallerPhone('+91 ');
                  return;
                }
                if (!raw.startsWith('+91')) {
                  const cleaned = raw.replace(/^\+?91\s*/, '');
                  setCallerPhone(`+91 ${cleaned}`);
                  return;
                }
                setCallerPhone(raw);
              }}
              type="tel"
            />
            <Input
              label="Patient Name"
              placeholder="Patient name (optional)"
              value={patientName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
            />
            <Select
              label="Patient Condition"
              value={patientCondition}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPatientCondition(e.target.value)}
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
                placeholder="Describe the emergency situation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateEmergency} size="lg" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Create Emergency &amp; Get Location
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 2: Location ── */}
      {step === 'location' && (
        <>
          {/* SMS Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Send Location Request via SMS
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-gray-500">
                Send an SMS to <span className="font-semibold text-gray-700">{callerPhone}</span> with
                a link to share their live GPS location.
              </p>

              {!smsSent ? (
                <Button onClick={handleSendSMS} loading={sendingSMS} variant="primary" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Location SMS
                </Button>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    SMS sent! Waiting for caller to share location...
                  </div>
                  {!locationConfirmed && (
                    <div className="flex items-center gap-2 mt-2 text-blue-600 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Listening for location update in real-time...
                    </div>
                  )}
                </div>
              )}

              {locationConfirmed && locationSource === 'sms_link' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                    <Navigation className="h-4 w-4" />
                    Location received via SMS link: {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Manual Location Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-danger-500" />
                Or Set Location Manually
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              {!showManualLocation && !locationConfirmed ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowManualLocation(true)}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  I know the patient&apos;s location — enter manually
                </Button>
              ) : locationConfirmed && locationSource === 'manual' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                    <Navigation className="h-4 w-4" />
                    Manual location confirmed: {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                    {address && <span className="ml-1">— {address}</span>}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Search, click on the map, or enter coordinates.</p>
                  <MapPicker
                    latitude={location?.lat || 0}
                    longitude={location?.lng || 0}
                    onLocationChange={(lat, lng) => setLocation({ lat, lng })}
                    onAddressFound={(addr) => setAddress(addr)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={location?.lat || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setLocation({ lat: val, lng: location?.lng || 0 });
                        }}
                        className="input-field text-sm"
                        placeholder="e.g., 18.5204"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={location?.lng || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setLocation({ lat: location?.lat || 0, lng: val });
                        }}
                        className="input-field text-sm"
                        placeholder="e.g., 73.8567"
                      />
                    </div>
                  </div>
                  <Input
                    label="Address (Optional)"
                    placeholder="e.g., Near City Mall, MG Road, Pune"
                    value={address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                  />
                  {location && location.lat !== 0 && location.lng !== 0 && (
                    <Button onClick={handleSetManualLocation} loading={settingLocation} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm This Location
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Dispatch Button - only shown when location is confirmed */}
          {locationConfirmed && (
            <Card className="border-2 border-red-200 bg-red-50">
              <div className="p-6 text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-red-800 font-semibold text-lg">
                  <Rocket className="h-6 w-6" />
                  Location Confirmed — Ready to Dispatch
                </div>
                <p className="text-sm text-red-700">
                  This will automatically assign the nearest ambulance, alert the nearest hospital,
                  and notify traffic police along the route.
                </p>
                <Button
                  onClick={handleDispatch}
                  loading={dispatching}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[250px]"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  DISPATCH EMERGENCY
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── STEP 3: Dispatched Summary ── */}
      {step === 'dispatched' && dispatchResult && (
        <div className="space-y-4">
          <Card className="border-2 border-green-200 bg-green-50">
            <div className="p-6 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold text-green-800">Emergency Dispatched Successfully!</h3>
              <p className="text-sm text-green-700">All resources have been automatically assigned and notified.</p>
            </div>
          </Card>

          {/* Assigned Ambulance */}
          {dispatchResult.assignedAmbulance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="h-5 w-5 text-primary-600" />
                  Assigned Ambulance
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 space-y-1">
                  <p className="font-semibold text-gray-900">{dispatchResult.assignedAmbulance.vehicleNumber}</p>
                  <p className="text-sm text-gray-600">Driver: {dispatchResult.assignedAmbulance.driverName}</p>
                  <p className="text-sm text-gray-600">Phone: {dispatchResult.assignedAmbulance.driverPhone}</p>
                  {dispatchResult.distanceToAmbulance != null && (
                    <p className="text-sm text-primary-700 font-medium">
                      Distance: {formatDistance(dispatchResult.distanceToAmbulance)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Assigned Hospital */}
          {dispatchResult.assignedHospital && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Assigned Hospital
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-1">
                  <p className="font-semibold text-gray-900">{dispatchResult.assignedHospital.hospitalName}</p>
                  <p className="text-sm text-gray-600">{dispatchResult.assignedHospital.address}</p>
                  <p className="text-sm text-gray-600">Phone: {dispatchResult.assignedHospital.phone}</p>
                  {dispatchResult.distanceToHospital != null && (
                    <p className="text-sm text-green-700 font-medium">
                      Distance: {formatDistance(dispatchResult.distanceToHospital)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Traffic Police on Route */}
          {dispatchResult.assignedTrafficPolice?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Traffic Police Notified ({dispatchResult.assignedTrafficPolice.length})
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-sm text-gray-500 mb-3">
                  Only officers within 1–2 km of the ambulance route have been notified.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dispatchResult.assignedTrafficPolice.map((tp: any) => (
                    <div key={tp._id} className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                      <p className="font-medium text-gray-900">{tp.user?.fullName || 'Officer'}</p>
                      <p className="text-gray-500">Badge: {tp.badgeNumber}</p>
                      <p className="text-gray-500">Area: {tp.assignedArea}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={() => router.push(`/dashboard/ers/emergencies`)} size="lg">
              View All Emergencies
            </Button>
            <Button variant="secondary" size="lg" onClick={() => {
              // Reset for new emergency
              setEmergencyId(null);
              setStep('phone');
              setCallerPhone('');
              setSmsSent(false);
              setLocationConfirmed(false);
              setLocationSource(null);
              setLocation(null);
              setAddress('');
              setShowManualLocation(false);
              setPatientName('');
              setPatientCondition('serious');
              setDescription('');
              setDispatchResult(null);
            }}>
              Create Another Emergency
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
