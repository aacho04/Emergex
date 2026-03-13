import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#ef233c] hover:bg-[#ff3b3b] text-white focus:ring-[#ff3b3b]',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 focus:ring-[#ff3b3b]',
    danger: 'bg-[#b91c1c] hover:bg-[#dc2626] text-white focus:ring-[#ef4444]',
    success: 'bg-[#16a34a] hover:bg-[#22c55e] text-white focus:ring-[#4ade80]',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-[#ff3b3b]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
