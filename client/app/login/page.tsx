'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Siren, LogIn, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { loginSchema, LoginFormData } from '@/utils/validators';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white items-center justify-center p-12 sticky top-0 h-screen">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
              <Siren className="h-10 w-10" />
            </div>
            <span className="text-3xl font-bold">Emergex</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Emergency Response System
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Coordinating citizens, ERS officers, ambulances, hospitals, traffic police, and volunteers for swift emergency response.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {['ERS Officers', 'Ambulances', 'Hospitals', 'Traffic Police'].map((role) => (
              <div
                key={role}
                className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm font-medium"
              >
                {role}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Siren className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Emergex</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Username"
              placeholder="Enter your username"
              error={errors.username?.message}
              autoComplete="username"
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
              icon={<LogIn className="h-5 w-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Hospital?{' '}
              <Link href="/register-hospital" className="text-primary-600 hover:text-primary-700 font-medium">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
