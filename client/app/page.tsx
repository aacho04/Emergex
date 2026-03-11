'use client';

import { useState } from 'react';
import { Phone, Heart, Shield, Siren, Users, Building2, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { volunteerAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { volunteerFormSchema, VolunteerFormData } from '@/utils/validators';
import Link from 'next/link';

export default function HomePage() {
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
  });

  const handleSOSClick = () => {
    window.location.href = 'tel:108';
  };

  const onSubmitVolunteer = async (data: VolunteerFormData) => {
    setIsSubmitting(true);
    try {
      await volunteerAPI.register(data);
      setToast({ message: 'Thank you for registering as a volunteer!', type: 'success' });
      reset();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Registration failed. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Siren className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Emergex</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Features
              </a>
              <a href="#volunteer" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Volunteer
              </a>
              <a href="#hospital-register" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                Hospital
              </a>
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-sm font-medium text-gray-600 py-2">Features</a>
                <a href="#volunteer" className="text-sm font-medium text-gray-600 py-2">Volunteer</a>
                <a href="#hospital-register" className="text-sm font-medium text-gray-600 py-2">Hospital</a>
                <Link href="/login">
                  <Button variant="primary" className="w-full">Login</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-white">
                Every Second
                <br />
                Saves a Life
              </h1>
              <p className="mt-6 text-lg text-primary-100 leading-relaxed max-w-xl">
                Emergex connects citizens, ERS officers, ambulances, hospitals, traffic police, and volunteers for swift and coordinated emergency response.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSOSClick}
                  className="sos-button inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-6 py-3 text-base transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  SOS - Call 108
                </button>
                <Link href="/login">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 w-full sm:w-auto"
                    icon={<ArrowRight className="h-5 w-5" />}
                  >
                    System Login
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Siren className="h-8 w-8" />, label: 'Quick Response', value: '< 5 min' },
                { icon: <Shield className="h-8 w-8" />, label: 'Active Units', value: '24/7' },
                { icon: <Users className="h-8 w-8" />, label: 'Volunteers', value: '1000+' },
                { icon: <Building2 className="h-8 w-8" />, label: 'Hospitals', value: '500+' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="text-primary-200 mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-primary-200 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">How Emergex Works</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              A streamlined emergency response workflow connecting all responders in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Phone className="h-6 w-6" />,
                title: 'SOS Alert',
                desc: 'Citizens press the SOS button to directly call 108 for immediate emergency assistance.',
                color: 'bg-red-50 text-red-600',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'ERS Dispatch',
                desc: 'ERS officers receive calls, evaluate condition, and assign nearby ambulances, hospitals, and traffic police.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: <Siren className="h-6 w-6" />,
                title: 'Coordinated Response',
                desc: 'Ambulances get real-time alerts, traffic police clear routes, and nearby volunteers are activated.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: <Building2 className="h-6 w-6" />,
                title: 'Hospital Ready',
                desc: 'Hospitals receive advance notification and prepare for incoming patients. Rating system ensures quality care.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'Live Tracking',
                desc: 'Real-time location tracking for ambulances and traffic police ensures optimal coordination.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: <Heart className="h-6 w-6" />,
                title: 'Community First Responders',
                desc: 'Nearby volunteers with medical training are activated before ambulance arrival for critical first aid.',
                color: 'bg-teal-50 text-teal-600',
              },
            ].map((feature) => (
              <Card key={feature.title} className="text-center" hover>
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Registration */}
      <section id="volunteer" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-xl bg-teal-50 mb-4">
              <Heart className="h-8 w-8 text-teal-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Become a Volunteer</h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              Join the Community First Responders program. Help save lives by providing critical assistance before ambulance arrival.
            </p>
          </div>

          <Card className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit(onSubmitVolunteer)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Address"
                placeholder="Enter your address"
                error={errors.address?.message}
                {...register('address')}
              />
              <Input
                label="Medical License Number (Optional)"
                placeholder="Enter if applicable"
                error={errors.medicalLicenseNumber?.message}
                {...register('medicalLicenseNumber')}
              />
              <Input
                label="Medical Student College ID (Optional)"
                placeholder="Enter if applicable"
                error={errors.medicalStudentCollegeId?.message}
                {...register('medicalStudentCollegeId')}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Register as Volunteer
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Hospital Registration CTA */}
      <section id="hospital-register" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex p-3 rounded-xl bg-purple-50 mb-4">
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Hospital Registration</h2>
          <p className="mt-3 text-gray-500 max-w-lg mx-auto mb-8">
            Register your hospital with Emergex to receive emergency patient transfers and manage volunteers.
          </p>
          <Link href="/register-hospital">
            <Button size="lg" icon={<ArrowRight className="h-5 w-5" />}>
              Register Your Hospital
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <Siren className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Emergex</span>
            </div>
            <p className="text-sm">Emergency Response System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
