'use client';

import { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, XCircle, Loader2, Navigation } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ShareLocationPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'requesting' | 'sending' | 'success' | 'error' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('sending');
        try {
          const response = await fetch(`${API_BASE_URL}/emergencies/location/${params.token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage(data.message || 'Failed to share location.');
          }
        } catch {
          setStatus('error');
          setErrorMessage('Network error. Please check your connection and try again.');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          setStatus('error');
          setErrorMessage('Could not determine your location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            <MapPin className="h-4 w-4" />
            EMERGEX
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Location Sharing</h1>
          <p className="text-gray-500 mt-1">Your location is needed to send an ambulance to you.</p>
        </div>

        {/* Status Cards */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {status === 'requesting' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Navigation className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Allow Location Access</h2>
              <p className="text-sm text-gray-500">
                Please allow location access when prompted by your browser.
                This helps emergency services reach you faster.
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for permission...
              </div>
            </div>
          )}

          {status === 'sending' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Sending Your Location</h2>
              <p className="text-sm text-gray-500">
                Please wait while we share your location with the emergency response team...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-green-800">Location Shared Successfully!</h2>
              <p className="text-sm text-gray-600">
                Your location has been sent to the emergency response team.
                An ambulance is being dispatched to your location.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <strong>Stay where you are.</strong> Help is on the way. Keep your phone accessible.
              </div>
            </div>
          )}

          {status === 'denied' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-amber-800">Location Permission Denied</h2>
              <p className="text-sm text-gray-600">
                You denied location access. To share your location, please enable location
                access in your browser settings and try again.
              </p>
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
              >
                <Navigation className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-red-800">Something Went Wrong</h2>
              <p className="text-sm text-gray-600">{errorMessage}</p>
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
              >
                <Navigation className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Emergex Emergency Response System
        </p>
      </div>
    </div>
  );
}
