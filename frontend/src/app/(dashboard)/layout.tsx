"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import TimerWidget from '@/components/TimerWidget';
import NotificationBell from '@/components/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Ambil data user dari localStorage yang disimpan saat login
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Cek jika user adalah superadmin
        if (user.role?.name === 'superadmin') {
          setIsSuperadmin(true);
        }
        
        // Ambil daftar permission (berdasarkan struktur data role.permissions)
        if (user.role?.permissions) {
          const perms = user.role.permissions.map((p: any) => p.name);
          setUserPermissions(perms);
        }
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  // Tutup menu mobile otomatis setiap kali rute berpindah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/', permission: null },
    { name: 'Logbook Saya', href: '/logbook', permission: 'view-logbook' },
    { name: 'Laporan & Rekap', href: '/recap', permission: 'view-logbook' },
    { name: 'Pengajuan Payroll', href: '/payroll', permission: 'manage-payroll' },
    { name: 'Verifikasi Logbook', href: '/director/logbooks', permission: 'approve-payroll' },
    { name: 'Approval Payroll', href: '/director/payrolls', permission: 'approve-payroll' },
    { name: 'Approval Akun', href: '/admin/approval', permission: 'manage-users' },
    { name: 'Role & Permission', href: '/admin/roles', permission: 'manage-roles' },
    { name: 'Audit Log', href: '/admin/audit-logs', permission: 'view-reports' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getPageTitle = () => {
    if (pathname.startsWith('/notifications')) return 'Pusat Notifikasi';
    if (pathname.startsWith('/admin/audit-logs')) return 'Audit Log Sistem';
    return navigation.find(n => n.href === pathname || (n.href !== '/' && pathname.startsWith(n.href)))?.name || 'Dashboard';
  };

  // Nav items renderer reusable untuk desktop & mobile drawer
  const renderNavItems = () => (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {navigation.map((item) => {
        const hasAccess = isSuperadmin || !item.permission || userPermissions.includes(item.permission);
        if (!hasAccess) {
          return null;
        }
        
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ─── 1. Desktop Sidebar (Hidden on Mobile/Tablet < lg) ─── */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col shadow-lg flex-shrink-0">
        <div className="p-6 text-2xl font-bold tracking-widest text-center border-b border-gray-800 text-blue-400">
          OSS
        </div>
        {renderNavItems()}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-400 font-semibold hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout Keluar
          </button>
        </div>
      </aside>

      {/* ─── 2. Mobile Sidebar Drawer (Overlay on Mobile/Tablet) ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-gray-900 text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-800">
              <span className="text-xl font-bold tracking-widest text-blue-400 pl-2">
                OSS
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Tutup Menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Items */}
            {renderNavItems()}

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-800">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 font-semibold hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Main Content Area (Full Width on Mobile) ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button (Only on Mobile/Tablet) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              aria-label="Buka Menu Navigasi"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Widgets */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <NotificationBell />
            <TimerWidget />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
