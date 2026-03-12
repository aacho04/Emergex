'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Heart, MapPin, Award, Phone, AlertTriangle, CheckCircle, Star, Shield, Truck
} from 'lucide-react';
import LiveTrackingMap, { MapMarker } from '@/components/maps/LiveTrackingMap';

const FALLBACK_API_URL = 'https://emergex.onrender.com/api';

const resolveApiBaseUrl = () => {
  const envBase = process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (envBase.startsWith(origin)) {
      return FALLBACK_API_URL;
    }
  }
  return envBase;
};

const API_BASE = resolveApiBaseUrl();

interface NearbyAmbulance {
  _id: string;
  vehicleNumber: string;
  driverName: string;
  ambulanceStatus: string;
  location: { lat: number; lng: number };
  distance: number;
}

interface EmergencyAlert {
  emergencyId: string;
  patient: {
    name?: string;
    condition?: string;
    location: { lat: number; lng: number };
    address?: string;
    callerPhone?: string;
  };
  assignedAmbulance: {
    id: string;
    vehicleNumber: string;
    driverName: string;
    location: { lat: number; lng: number };
    distance?: number;
  };
  hospital?: {
    name: string;
    location: { lat: number; lng: number };
  };
  nearbyAmbulances: NearbyAmbulance[];
}

export default function VolunteerPortal() {
  const params = useParams();
  const volunteerId = params.id as string;

  const [volunteer, setVolunteer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [nearbyAmbulances, setNearbyAmbulances] = useState<NearbyAmbulance[]>([]);
  const [ambulancePos, setAmbulancePos] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch volunteer profile
  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const res = await fetch(`${API_BASE}/volunteers/${volunteerId}`);
        const data = await res.json();
        if (data.success) {
          setVolunteer(data.data);
        } else {
          setError('Volunteer not found');
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteer();
  }, [volunteerId]);

  // Request own location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        // Update location on server
        fetch(`${API_BASE}/volunteers/${volunteerId}/location`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.lat, longitude: loc.lng }),
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [volunteerId]);

  // Fetch nearby ambulances periodically
  useEffect(() => {
    if (!myLocation) return;
    const fetchNearby = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/volunteers/${volunteerId}/nearby-ambulances?lat=${myLocation.lat}&lng=${myLocation.lng}`
        );
        const data = await res.json();
        if (data.success) {
          setNearbyAmbulances(data.data);
        }
      } catch {}
    };
    fetchNearby();
    const interval = setInterval(fetchNearby, 15000);
    return () => clearInterval(interval);
  }, [myLocation, volunteerId]);

  // Poll for emergency alerts (simple polling approach — works without auth socket)
  useEffect(() => {
    // We listen for socket events via the global broadcast
    // Since volunteers don't authenticate, we use a simple polling mechanism
    // In production, this would use a WebSocket connection
    const pollInterval = setInterval(async () => {
      if (!volunteer || accepted) return;
      // The alert is pushed via the dispatch system
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [volunteer, accepted]);

  // Accept emergency
  const handleAccept = async () => {
    if (!alert) return;
    setAccepting(true);
    try {
      const res = await fetch(`${API_BASE}/volunteers/${volunteerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyId: alert.emergencyId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccepted(true);
        setVolunteer(data.data);
      }
    } catch {
      // retry
    } finally {
      setAccepting(false);
    }
  };

  // Simulate receiving an alert (in real usage, the dispatch system sends this via socket)
  // This effect listens for the global socket event
  useEffect(() => {
    // Use a simple BroadcastChannel or window event for demonstration
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'volunteer:emergency-alert' && event.data?.volunteerId === volunteerId) {
        setAlert(event.data);
        if (event.data.assignedAmbulance?.location) {
          setAmbulancePos(event.data.assignedAmbulance.location);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [volunteerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-pulse text-purple-600 font-semibold">Loading volunteer portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  // Build extra markers for the map
  const extraMarkers: MapMarker[] = nearbyAmbulances.map((amb) => ({
    id: amb._id,
    position: amb.location,
    label: `${amb.vehicleNumber} (${amb.distance.toFixed(1)} km)`,
    type: 'ambulance' as const,
  }));

  if (myLocation) {
    extraMarkers.push({
      id: 'me',
      position: myLocation,
      label: 'You',
      type: 'volunteer',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 pb-8">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{volunteer?.name}</p>
              <p className="text-xs text-gray-500">Volunteer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                <Award className="h-4 w-4" />
                {volunteer?.rewardPoints || 0} pts
              </div>
              <p className="text-[10px] text-gray-400">{volunteer?.emergenciesAssisted || 0} assists</p>
            </div>
            {volunteer?.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-4 w-4 fill-amber-400" />
                {volunteer.averageRating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Active Emergency Alert */}
        {alert && !accepted && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 animate-pulse-slow">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-800">Emergency Near You!</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Patient</p>
                  <p className="font-semibold">{alert.patient.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Condition</p>
                  <p className="font-semibold capitalize">{alert.patient.condition || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Ambulance</p>
                  <p className="font-semibold">{alert.assignedAmbulance.vehicleNumber}</p>
                </div>
                {alert.hospital && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Hospital</p>
                    <p className="font-semibold">{alert.hospital.name}</p>
                  </div>
                )}
              </div>
              {alert.patient.address && (
                <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-gray-700">{alert.patient.address}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : '✅ Accept & Assist'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">
              +50 reward points for assisting
            </p>
          </div>
        )}

        {/* Accepted confirmation */}
        {accepted && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800">You&apos;re Helping!</h3>
            <p className="text-sm text-gray-600 mt-1">
              Proceed to the patient location. The ambulance is on its way.
            </p>
          </div>
        )}

        {/* Nearby Ambulances (Uber-like) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-red-500" />
              Nearby Ambulances
            </h3>
          </div>
          <div className="p-4">
            <LiveTrackingMap
              ambulancePosition={ambulancePos}
              patientPosition={alert?.patient.location || null}
              hospitalPosition={alert?.hospital?.location || null}
              phase="to_patient"
              extraMarkers={extraMarkers}
              showDirections={!!alert}
              height="350px"
            />
          </div>
          {nearbyAmbulances.length > 0 && (
            <div className="px-6 pb-4">
              <div className="space-y-2">
                {nearbyAmbulances.slice(0, 5).map((amb) => (
                  <div
                    key={amb._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚑</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{amb.vehicleNumber}</p>
                        <p className="text-xs text-gray-500">{amb.driverName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{amb.distance.toFixed(1)} km</p>
                      <p className={`text-xs font-medium ${
                        amb.ambulanceStatus === 'available' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {amb.ambulanceStatus === 'available' ? 'Available' : 'Busy'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {nearbyAmbulances.length === 0 && (
            <div className="px-6 pb-4 text-center text-sm text-gray-400">
              No ambulances detected nearby
            </div>
          )}
        </div>

        {/* Reward Points & Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <Award className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{volunteer?.rewardPoints || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Reward Points</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{volunteer?.emergenciesAssisted || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Assists</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {volunteer?.averageRating ? volunteer.averageRating.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Rating</p>
          </div>
        </div>

        {/* Incentive Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Reward Tiers
          </h3>
          <div className="space-y-2">
            {[
              { points: 100, reward: 'Certificate of Appreciation', icon: '📜' },
              { points: 250, reward: 'Emergency First-Aid Kit', icon: '🩹' },
              { points: 500, reward: 'Gold Volunteer Badge', icon: '🥇' },
              { points: 1000, reward: 'Annual Health Checkup Voucher', icon: '🏥' },
            ].map((tier) => (
              <div
                key={tier.points}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  (volunteer?.rewardPoints || 0) >= tier.points
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tier.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tier.reward}</p>
                    <p className="text-xs text-gray-500">{tier.points} points</p>
                  </div>
                </div>
                {(volunteer?.rewardPoints || 0) >= tier.points ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <p className="text-xs text-gray-400">
                    {tier.points - (volunteer?.rewardPoints || 0)} to go
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
