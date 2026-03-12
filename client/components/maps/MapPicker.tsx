'use client';

import { useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from '@react-google-maps/api';
import { Search, Loader2 } from 'lucide-react';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '350px',
};

const defaultCenter = { lat: 18.5204, lng: 73.8567 }; // Pune, India

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressFound,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const center =
    latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationChange(lat, lng);

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onAddressFound?.(results[0].formatted_address);
          }
        });
      }
    },
    [onLocationChange, onAddressFound]
  );

  const onAutocompleteLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      autocompleteRef.current = autocomplete;
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      onLocationChange(lat, lng);

      if (place.formatted_address) {
        onAddressFound?.(place.formatted_address);
      }

      // Pan map to the selected place
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }
    }
  }, [onLocationChange, onAddressFound]);

  // Pan map when coordinates change externally
  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.panTo({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className="w-full h-[350px] rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-sm text-red-500">
        Failed to load Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[350px] rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Places Autocomplete Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'in' },
          }}
        >
          <input
            type="text"
            placeholder="Search location... (e.g., Pune Station, MG Road)"
            className="input-field text-sm pl-9"
          />
        </Autocomplete>
      </div>

      {/* Google Map */}
      <div className="w-full rounded-lg overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={onMapClick}
        >
          {latitude !== 0 && longitude !== 0 && (
            <Marker position={{ lat: latitude, lng: longitude }} />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
