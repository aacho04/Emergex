'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Siren, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
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
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        username: data.email,
        specialties: data.specialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      };
      const res = await authAPI.registerHospital(payload);
      setRegisteredEmail(res.data.data?.email || data.email);
      setStep('otp');
      setToast({ message: 'OTP sent to your email!', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Registration failed.',
        type: 'error',
      });
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setToast({ message: 'Please enter the complete 6-digit OTP', type: 'error' });
      return;
    }

    setVerifying(true);
    try {
      await authAPI.verifyEmail(registeredEmail, otpString);
      setStep('done');
      setToast({ message: 'Email verified successfully!', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Invalid OTP. Please try again.',
        type: 'error',
      });
    } finally {
      setVerifying(false);
    }
  };

  const resendOTP = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP(registeredEmail);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setToast({ message: 'New OTP sent to your email!', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Failed to resend OTP.',
        type: 'error',
      });
    } finally {
      setResending(false);
    }
  };

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Card className="max-w-md w-full text-center p-8">
          <div className="inline-flex p-3 rounded-xl bg-primary-50 mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-500 mb-1">We sent a 6-digit OTP to</p>
          <p className="text-sm font-semibold text-gray-900 mb-6">{registeredEmail}</p>

          <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            ))}
          </div>

          <Button onClick={verifyOTP} loading={verifying} className="w-full mb-4" size="lg">
            Verify OTP
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Didn&apos;t receive the OTP?</span>
            <button
              onClick={resendOTP}
              disabled={resending}
              className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
              Resend
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Success Step
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="inline-flex p-3 rounded-xl bg-green-50 mb-4">
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-500 mb-6">
            Your email has been verified. You can now log in to your hospital dashboard.
          </p>
          <Link href="/login">
            <Button className="w-full" size="lg">Go to Login</Button>
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
              <p className="text-xs text-gray-500 mb-3">Your email will be used as your username to log in.</p>
              <Input
                label="Password"
                type="password"
                placeholder="Choose a password"
                error={errors.password?.message}
                {...register('password')}
              />
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
