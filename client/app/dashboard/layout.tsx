'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  Siren,
  LayoutDashboard,
  Users,
  Ambulance as AmbulanceIcon,
  Building2,
  Shield,
  Heart,
  AlertTriangle,
  LogOut,
  Search,
  Menu,
  X,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { cn, getRoleLabel } from '@/utils/helpers';
import { UserRole } from '@/types/user.types';
import Link from 'next/link';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getSidebarLinks(role: UserRole): SidebarLink[] {
  const base = (path: string) => `/dashboard/${path}`;

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        { href: base('super-admin'), label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: base('super-admin/ers-officers'), label: 'ERS Officers', icon: <Users className="h-5 w-5" /> },
        { href: base('super-admin/ambulances'), label: 'Ambulances', icon: <AmbulanceIcon className="h-5 w-5" /> },
        { href: base('super-admin/traffic-police'), label: 'Traffic Police', icon: <Shield className="h-5 w-5" /> },
        { href: base('super-admin/hospitals'), label: 'Hospitals', icon: <Building2 className="h-5 w-5" /> },
        { href: base('super-admin/emergencies'), label: 'Emergencies', icon: <AlertTriangle className="h-5 w-5" /> },
        { href: base('super-admin/volunteers'), label: 'Volunteers', icon: <Heart className="h-5 w-5" /> },
      ];
    case UserRole.ERS_OFFICER:
      return [
        { href: base('ers'), label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: base('ers/new-emergency'), label: 'New Emergency', icon: <AlertTriangle className="h-5 w-5" /> },
        { href: base('ers/emergencies'), label: 'All Emergencies', icon: <AlertTriangle className="h-5 w-5" /> },
      ];
    case UserRole.AMBULANCE:
      return [
        { href: base('ambulance'), label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: base('ambulance/emergencies'), label: 'My Emergencies', icon: <AlertTriangle className="h-5 w-5" /> },
      ];
    case UserRole.TRAFFIC_POLICE:
      return [
        { href: base('traffic-police'), label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: base('traffic-police/alerts'), label: 'Route Alerts', icon: <AlertTriangle className="h-5 w-5" /> },
      ];
    case UserRole.HOSPITAL:
      return [
        { href: base('hospital'), label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: base('hospital/volunteers'), label: 'Volunteers', icon: <Heart className="h-5 w-5" /> },
        { href: base('hospital/settings'), label: 'Settings', icon: <Settings className="h-5 w-5" /> },
      ];
    default:
      return [];
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, clearAuth, token } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    setCurrentPath(window.location.pathname);
  }, [token, user, router]);

  if (!user || !token) return null;

  const sidebarLinks = getSidebarLinks(user.role as UserRole);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar-bg flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="bg-primary-600 p-1.5 rounded-lg">
            <Siren className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Emergex</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Menu
          </p>
          <div className="space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setCurrentPath(link.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  currentPath === link.href
                    ? 'bg-sidebar-active text-white'
                    : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                )}
              >
                {link.icon}
                {link.label}
                {currentPath === link.href && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <p className="text-xs text-gray-400">{getRoleLabel(user.role)}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-gray-600 placeholder:text-gray-400 w-48"
                />
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* User avatar */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-400">{getRoleLabel(user.role)}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
