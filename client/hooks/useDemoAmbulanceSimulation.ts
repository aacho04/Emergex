'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrafficPoint {
  id: string;
  label: string;
  position: LatLng;
}

interface DemoSimulationOptions {
  enabled: boolean;
  startPosition: LatLng | null;
  patientPosition: LatLng | null;
  hospitalPosition: LatLng | null;
  speedMps?: number;
  tickMs?: number;
  loop?: boolean;
  alertLeadSeconds?: number;
  trafficPoints?: TrafficPoint[];
  onTrafficAlert?: (points: TrafficPoint[]) => void;
}

interface DemoSimulationState {
  position: LatLng | null;
  phase: 'to_patient' | 'to_hospital';
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const distanceMeters = (from: LatLng, to: LatLng) => {
  const earthRadius = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const moveTowards = (from: LatLng, to: LatLng, stepMeters: number) => {
  const dist = distanceMeters(from, to);
  if (dist === 0 || stepMeters >= dist) {
    return { ...to };
  }
  const ratio = stepMeters / dist;
  return {
    lat: from.lat + (to.lat - from.lat) * ratio,
    lng: from.lng + (to.lng - from.lng) * ratio,
  };
};

export const useDemoAmbulanceSimulation = (options: DemoSimulationOptions): DemoSimulationState => {
  const {
    enabled,
    startPosition,
    patientPosition,
    hospitalPosition,
    speedMps = 12,
    tickMs = 1000,
    loop = true,
    alertLeadSeconds = 3,
    trafficPoints = [],
    onTrafficAlert,
  } = options;

  const [position, setPosition] = useState<LatLng | null>(startPosition);
  const [phase, setPhase] = useState<'to_patient' | 'to_hospital'>('to_patient');
  const [isRunning, setIsRunning] = useState(false);

  const positionRef = useRef<LatLng | null>(startPosition);
  const patientRef = useRef<LatLng | null>(patientPosition);
  const hospitalRef = useRef<LatLng | null>(hospitalPosition);
  const phaseRef = useRef<'to_patient' | 'to_hospital'>('to_patient');
  const alertedRef = useRef(false);

  useEffect(() => {
    positionRef.current = startPosition;
    setPosition(startPosition);
  }, [startPosition]);

  useEffect(() => {
    patientRef.current = patientPosition;
  }, [patientPosition]);

  useEffect(() => {
    hospitalRef.current = hospitalPosition;
  }, [hospitalPosition]);

  const setPhaseSafe = useCallback((nextPhase: 'to_patient' | 'to_hospital') => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const start = useCallback(() => {
    if (!enabled || !startPosition || !patientPosition || !hospitalPosition) return;
    setIsRunning(true);
  }, [enabled, startPosition, patientPosition, hospitalPosition]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    alertedRef.current = false;
    setPhaseSafe('to_patient');
    positionRef.current = startPosition;
    setPosition(startPosition);
  }, [setPhaseSafe, startPosition]);

  useEffect(() => {
    if (!enabled || !isRunning) return;

    const intervalId = setInterval(() => {
      const current = positionRef.current;
      const target = phaseRef.current === 'to_patient' ? patientRef.current : hospitalRef.current;

      if (!current || !target) return;

      const remaining = distanceMeters(current, target);
      const secondsRemaining = remaining / speedMps;

      if (!alertedRef.current && secondsRemaining <= alertLeadSeconds && trafficPoints.length > 0) {
        alertedRef.current = true;
        onTrafficAlert?.(trafficPoints);
      }

      if (remaining <= speedMps) {
        positionRef.current = { ...target };
        setPosition({ ...target });

        if (loop) {
          const nextPhase = phaseRef.current === 'to_patient' ? 'to_hospital' : 'to_patient';
          alertedRef.current = false;
          setPhaseSafe(nextPhase);
        } else {
          setIsRunning(false);
        }

        return;
      }

      const next = moveTowards(current, target, speedMps);
      positionRef.current = next;
      setPosition(next);
    }, tickMs);

    return () => clearInterval(intervalId);
  }, [
    enabled,
    isRunning,
    speedMps,
    tickMs,
    loop,
    alertLeadSeconds,
    trafficPoints,
    onTrafficAlert,
    setPhaseSafe,
  ]);

  return {
    position,
    phase,
    isRunning,
    start,
    stop,
    reset,
  };
};
