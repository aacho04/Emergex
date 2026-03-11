import { cn } from '@/utils/helpers';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal' | 'primary' | 'success' | 'danger' | 'warning';
  subtitle?: string;
}

export function StatCard({ title, value, icon: IconProp, color = 'blue', subtitle }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'blue', primary: 'blue',
    green: 'green', success: 'green',
    red: 'red', danger: 'red',
    amber: 'amber', warning: 'amber',
    purple: 'purple', teal: 'teal',
  };

  const mapped = colorMap[color] || 'blue';

  const bgColors: Record<string, string> = {
    blue: 'bg-primary-50',
    green: 'bg-success-50',
    red: 'bg-danger-50',
    amber: 'bg-accent-50',
    purple: 'bg-purple-50',
    teal: 'bg-teal-50',
  };

  const iconColors: Record<string, string> = {
    blue: 'text-primary-600',
    green: 'text-success-500',
    red: 'text-danger-500',
    amber: 'text-accent-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
  };

  // Check if IconProp is a Lucide component (function) or a ReactNode
  const isComponent = typeof IconProp === 'function';
  const iconElement = isComponent
    ? React.createElement(IconProp as LucideIcon, { className: 'h-6 w-6' })
    : IconProp;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', bgColors[mapped])}>
          <div className={iconColors[mapped]}>{iconElement}</div>
        </div>
      </div>
    </div>
  );
}
