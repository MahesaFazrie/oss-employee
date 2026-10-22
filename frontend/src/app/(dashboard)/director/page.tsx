"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DirectorDashboardView from '@/components/DirectorDashboardView';

export default function DirectorDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(userStr);
      const isSuperadmin = user.role?.name === 'superadmin';
      const isDirector = user.role?.name === 'direktur';
      const hasApprovePerm = user.role?.permissions?.some((p: any) => p.name === 'approve-payroll');

      if (isSuperadmin || isDirector || hasApprovePerm) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthorized(false);
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-80 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
        <div className="text-red-500 text-4xl">🚫</div>
        <h3 className="text-lg font-bold text-red-900">Akses Dibatasi</h3>
        <p className="text-sm text-red-700 max-w-md mx-auto">
          Halaman Dashboard Direktur hanya dapat diakses oleh Direktur dan Manajemen yang memiliki hak otorisasi.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Kembali ke Dashboard Utama
        </button>
      </div>
    );
  }

  return (
    <DirectorDashboardView
      onSwitchView={() => router.push('/')}
    />
  );
}
