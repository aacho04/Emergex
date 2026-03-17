'use client';

import { useEffect, useState } from 'react';

type PermissionState = 'default' | 'denied' | 'granted' | 'unsupported';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export default function EnableNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const subscribeToPush = async () => {
    if (!vapidPublicKey) {
      console.warn('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY for push subscription.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log('Existing push subscription:', existingSubscription.toJSON());
      return;
    }

    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('New push subscription:', newSubscription.toJSON());
  };

  const handleEnableNotifications = async () => {
    if (permission === 'unsupported') {
      console.warn('Notifications are not supported in this browser.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
      } else {
        console.log('Notification permission dismissed or denied.');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (permission === 'unsupported' || permission === 'granted') {
    return null;
  }

  return (
    <button
      onClick={handleEnableNotifications}
      className="bg-red-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-red-700 transition-colors"
      disabled={isLoading}
    >
      {isLoading ? 'Enabling...' : 'Enable Emergency Alerts'}
    </button>
  );
}
