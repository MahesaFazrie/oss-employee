"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import TimerWidget from '@/components/TimerWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Nanti nilai ini akan dinamis diambil dari Context/API /auth/me
  // Saya tambahkan 'logbooks.view' untuk mengizinkan menu logbook
  const [userPermissions] = useState<string[]>(['dashboard.view', 'users.approve', 'roles.view', 'logbooks.view']);

  const navigation = [
    { name: 'Dashboard', href: '/', permission: null },
    { name: 'Logbook Saya', href: '/logbook', permission: 'logbooks.view' },
    { name: 'Approval Akun', href: '/admin/approval', permission: 'users.approve' },
    { name: 'Role & Permission', href: '/admin/roles', permission: 'roles.view' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - OSS-111 */}
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-lg">
        <div className="p-6 text-2xl font-bold tracking-widest text-center border-b border-gray-800 text-blue-400">
          OSS
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            // Permission-aware rendering (OSS-111)
            if (item.permission && !userPermissions.includes(item.permission)) {
              return null;
            }
            
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`block px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-400 font-semibold hover:bg-gray-800 rounded-lg transition-colors"
          >
            Logout Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">
            {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
          </h1>
          <TimerWidget />
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
