'use client';

import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  lat: number;
  lng: number;
  label?: string;
  showPin?: boolean;
}

export function LocationDisplay({ lat, lng, label, showPin = true }: LocationDisplayProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {showPin && <MapPin className="h-4 w-4 text-primary-600 shrink-0" />}
      <div>
        {label && <span className="font-medium text-gray-700">{label}: </span>}
        <span className="text-gray-500">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
      </div>
    </div>
  );
}

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Location</span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <MapPin className="h-3 w-3" />
          Use Current Location
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude || ''}
            onChange={(e) => onLocationChange(parseFloat(e.target.value), longitude)}
            className="input-field text-sm"
            placeholder="e.g., 28.6139"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude || ''}
            onChange={(e) => onLocationChange(latitude, parseFloat(e.target.value))}
            className="input-field text-sm"
            placeholder="e.g., 77.2090"
          />
        </div>
      </div>
      {latitude && longitude ? (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary-600" />
          <span className="text-sm text-gray-600">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
