'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/utils/helpers';

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on('notification', (data: any) => {
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: data.type,
          message: data.message,
          data: data.data,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
    });

    return cleanup;
  }, [on]);

  useEffect(() => {
    const cleanupEmergency = on('emergency:status', (data: any) => {
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: 'emergency_update',
          message: `Emergency status: ${data.status}`,
          data,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
    });

    return cleanupEmergency;
  }, [on]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    !n.read && 'bg-primary-50/50'
                  )}
                >
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
