'use client';

import { create } from 'zustand';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  setLocation: (lat: number, lng: number) => void;
  setError: (error: string) => void;
  requestLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  error: null,
  setLocation: (latitude, longitude) => set({ latitude, longitude, error: null }),
  setError: (error) => set({ error }),
  requestLocation: () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
          });
        },
        (error) => {
          set({ error: error.message });
        },
        { enableHighAccuracy: true }
      );
    } else {
      set({ error: 'Geolocation is not supported by your browser' });
    }
  },
}));
