'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from '@react-google-maps/api';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '450px',
};

const defaultCenter = { lat: 18.5204, lng: 73.8567 };

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  label: string;
  type: 'ambulance' | 'patient' | 'hospital' | 'volunteer' | 'traffic';
}

interface LiveTrackingMapProps {
  /** Current ambulance position */
  ambulancePosition?: { lat: number; lng: number } | null;
  /** Patient location */
  patientPosition?: { lat: number; lng: number } | null;
  /** Hospital location */
  hospitalPosition?: { lat: number; lng: number } | null;
  /** Current navigation phase */
  phase?: 'to_patient' | 'to_hospital';
  /** Additional markers (volunteers, traffic police, other ambulances) */
  extraMarkers?: MapMarker[];
  /** Map container height override */
  height?: string;
  /** Show directions route */
  showDirections?: boolean;
}

const MARKER_COLORS: Record<string, string> = {
  ambulance: '#EF4444',
  patient: '#F59E0B',
  hospital: '#10B981',
  volunteer: '#8B5CF6',
  traffic: '#3B82F6',
};

const MARKER_ICONS: Record<string, string> = {
  ambulance: '🚑',
  patient: '🧑',
  hospital: '🏥',
  volunteer: '🤝',
  traffic: '👮',
};

export default function LiveTrackingMap({
  ambulancePosition,
  patientPosition,
  hospitalPosition,
  phase = 'to_patient',
  extraMarkers = [],
  height = '450px',
  showDirections = true,
}: LiveTrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const prevPhaseRef = useRef(phase);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Compute route when origin/destination change
  useEffect(() => {
    if (!isLoaded || !showDirections || !ambulancePosition) return;

    const destination = phase === 'to_patient' ? patientPosition : hospitalPosition;
    if (!destination) {
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: ambulancePosition,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setEta(leg.duration?.text || '');
            setDistance(leg.distance?.text || '');
          }
        }
      }
    );
  }, [isLoaded, showDirections, ambulancePosition, patientPosition, hospitalPosition, phase]);

  // Auto-fit bounds when phase changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      const bounds = new google.maps.LatLngBounds();
      if (ambulancePosition) bounds.extend(ambulancePosition);
      if (phase === 'to_patient' && patientPosition) bounds.extend(patientPosition);
      if (phase === 'to_hospital' && hospitalPosition) bounds.extend(hospitalPosition);
      mapRef.current.fitBounds(bounds, 80);
    }
  }, [phase, ambulancePosition, patientPosition, hospitalPosition, isLoaded]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl" style={{ height }}>
        <p className="text-red-500 text-sm">Failed to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl animate-pulse" style={{ height }}>
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    );
  }

  const center = ambulancePosition || patientPosition || defaultCenter;

  return (
    <div className="relative">
      {/* ETA / Distance overlay */}
      {(eta || distance) && (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur rounded-lg shadow-lg px-4 py-2 border">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">
                {phase === 'to_patient' ? 'To Patient' : 'To Hospital'}
              </p>
              <p className="text-sm font-bold text-gray-900">{eta}</p>
            </div>
            {distance && (
              <div className="border-l pl-4">
                <p className="text-[10px] uppercase font-semibold text-gray-400">Distance</p>
                <p className="text-sm font-bold text-gray-900">{distance}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase indicator */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow ${
          phase === 'to_patient'
            ? 'bg-amber-100 text-amber-800 border border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        }`}>
          {phase === 'to_patient' ? '🚑 → 🧑 Phase 1' : '🚑 → 🏥 Phase 2'}
        </span>
      </div>

      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={center}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {/* Directions route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: phase === 'to_patient' ? '#EF4444' : '#10B981',
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* Ambulance marker */}
        {ambulancePosition && (
          <Marker
            position={ambulancePosition}
            label={{ text: '🚑', fontSize: '24px' }}
            title="Ambulance"
            zIndex={100}
          />
        )}

        {/* Patient marker */}
        {patientPosition && (
          <Marker
            position={patientPosition}
            label={{ text: '🧑', fontSize: '22px' }}
            title="Patient"
            zIndex={90}
          />
        )}

        {/* Hospital marker */}
        {hospitalPosition && (
          <Marker
            position={hospitalPosition}
            label={{ text: '🏥', fontSize: '22px' }}
            title="Hospital"
            zIndex={90}
          />
        )}

        {/* Extra markers (volunteers, traffic police, other ambulances) */}
        {extraMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            label={{
              text: MARKER_ICONS[marker.type] || '📍',
              fontSize: '18px',
            }}
            title={marker.label}
            zIndex={50}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {/* Info window for clicked extra markers */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1">
              <p className="font-semibold text-sm">{selectedMarker.label}</p>
              <p className="text-xs text-gray-500 capitalize">{selectedMarker.type}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-1 text-[11px] text-gray-500">
        <span>🚑 Ambulance</span>
        <span>🧑 Patient</span>
        <span>🏥 Hospital</span>
        {extraMarkers.some((m) => m.type === 'volunteer') && <span>🤝 Volunteer</span>}
        {extraMarkers.some((m) => m.type === 'traffic') && <span>👮 Traffic Police</span>}
      </div>
    </div>
  );
}
