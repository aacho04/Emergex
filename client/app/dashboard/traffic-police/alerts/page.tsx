'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useSocket } from '@/hooks/useSocket';

export default function TrafficPoliceAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { on, off, emit } = useSocket();

  useEffect(() => {
    const handleAlert = (data: any) => {
      setAlerts((prev) => [{ ...data, timestamp: new Date().toISOString() }, ...prev]);
    };

    on('traffic:route-alert', handleAlert);
    on('emergency:assigned', handleAlert);

    return () => {
      off('traffic:route-alert', handleAlert);
      off('emergency:assigned', handleAlert);
    };
  }, [on, off]);

  const clearAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
    emit('traffic:cleared', { alertIndex: index });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Route Alerts</h2>
        <p className="text-gray-500 mt-1">Real-time route clearance notifications</p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Shield className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">No Active Alerts</p>
            <p className="text-sm text-gray-400 mt-2">Route clearance alerts will appear here in real-time</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any, index: number) => (
            <Card key={index}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Emergency Route Alert</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.patientName ? `Patient: ${alert.patientName}` : 'Emergency in progress'}
                        {alert.patientCondition && ` — Condition: ${alert.patientCondition}`}
                      </p>
                      {alert.ambulanceVehicle && (
                        <p className="text-xs text-gray-500 mt-1">Ambulance: {alert.ambulanceVehicle}</p>
                      )}
                      {alert.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="success" onClick={() => clearAlert(index)}>
                    Route Cleared
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
