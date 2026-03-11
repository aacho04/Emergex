'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Siren, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { hospitalRegisterSchema, HospitalRegisterFormData } from '@/utils/validators';
import { authAPI } from '@/services/api';
import Link from 'next/link';

export default function RegisterHospitalPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HospitalRegisterFormData>({
    resolver: zodResolver(hospitalRegisterSchema),
    defaultValues: {
      latitude: 0,
      longitude: 0,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  const onSubmit = async (data: HospitalRegisterFormData) => {
    try {
      const payload = {
        ...data,
        specialties: data.specialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      };
      await authAPI.registerHospital(payload);
      setSuccess(true);
      setToast({ message: 'Registration successful! Please check your email to verify your account.', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Registration failed.',
        type: 'error',
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <div className="inline-flex p-3 rounded-xl bg-green-50 mb-4">
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful</h2>
          <p className="text-gray-500 mb-6">
            Please check your email to verify your account. Once verified, you can log in to your hospital dashboard.
          </p>
          <Link href="/login">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Siren className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Emergex</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Registration</h1>
          <p className="text-gray-500 mt-2">Register your hospital with the Emergex network</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Hospital Name"
                placeholder="e.g., City General Hospital"
                error={errors.hospitalName?.message}
                {...register('hospitalName')}
              />
              <Input
                label="Registration Number"
                placeholder="Hospital registration number"
                error={errors.registrationNumber?.message}
                {...register('registrationNumber')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Contact Person Name"
                placeholder="Full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="hospital@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Phone"
                placeholder="Phone number"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Specialties"
                placeholder="e.g., Cardiology, Trauma (comma-separated)"
                error={errors.specialties?.message}
                {...register('specialties')}
              />
            </div>

            <Input
              label="Address"
              placeholder="Full hospital address"
              error={errors.address?.message}
              {...register('address')}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Total Beds"
                type="number"
                placeholder="0"
                error={errors.totalBeds?.message}
                {...register('totalBeds', { valueAsNumber: true })}
              />
              <Input
                label="Available Beds"
                type="number"
                placeholder="0"
                error={errors.availableBeds?.message}
                {...register('availableBeds', { valueAsNumber: true })}
              />
            </div>

            <LocationPicker
              latitude={lat}
              longitude={lng}
              onLocationChange={(newLat, newLng) => {
                setValue('latitude', newLat);
                setValue('longitude', newLng);
              }}
            />

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Login Credentials</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Username"
                  placeholder="Choose a username"
                  error={errors.username?.message}
                  {...register('username')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Choose a password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Register Hospital
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
