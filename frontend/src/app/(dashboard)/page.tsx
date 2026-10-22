"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { dashboardService, EmployeeDashboardData } from '@/services/dashboard';
import DirectorDashboardView from '@/components/DirectorDashboardView';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  return `${hours.toFixed(1)} jam`;
}

function getMonthName(month: number): string {
  return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
}

function getPayrollStatusConfig(status: string): { label: string; bgColor: string; textColor: string; icon: string } {
  const map: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
    draft:              { label: 'Draft',            bgColor: 'bg-gray-100',    textColor: 'text-gray-700',   icon: '📝' },
    submitted:          { label: 'Diajukan',         bgColor: 'bg-blue-100',    textColor: 'text-blue-800',   icon: '📤' },
    under_review:       { label: 'Sedang Ditinjau',  bgColor: 'bg-purple-100',  textColor: 'text-purple-800', icon: '🔍' },
    revision_requested: { label: 'Perlu Revisi',     bgColor: 'bg-amber-100',   textColor: 'text-amber-800',  icon: '⚠️' },
    approved:           { label: 'Disetujui',        bgColor: 'bg-green-100',   textColor: 'text-green-800',  icon: '✅' },
    rejected:           { label: 'Ditolak',          bgColor: 'bg-red-100',     textColor: 'text-red-800',    icon: '❌' },
    processed:          { label: 'Telah Dibayar',    bgColor: 'bg-emerald-100', textColor: 'text-emerald-800',icon: '💰' },
  };
  return map[status] ?? { label: status, bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: '❓' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** KPI Card */
function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}) {
  const content = (
    <div
      className={`relative bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow overflow-hidden ${href ? 'cursor-pointer group' : ''}`}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accent}`} />

      <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${accent.replace('bg-', 'bg-opacity-10 bg-').replace('-600', '-100')}`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>

      {href && (
        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/** Active Timer Card */
function ActiveTimerCard({ timer }: { timer: NonNullable<EmployeeDashboardData['active_timer']> }) {
  const [elapsed, setElapsed] = useState(timer.elapsed);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Pulsing indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-indigo-600 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Timer Sedang Berjalan</p>
          <p className="text-3xl font-mono font-bold tracking-widest mt-0.5">{formatDuration(elapsed)}</p>
          <p className="text-xs text-blue-200 mt-0.5">
            Dimulai pukul {new Date(timer.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
        </div>
      </div>

      <Link
        href="/logbook"
        className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors border border-white/30 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Buat Logbook
      </Link>
    </div>
  );
}

/** Payroll Status Card */
function PayrollStatusCard({ payroll }: { payroll: EmployeeDashboardData['latest_payroll'] }) {
  if (!payroll) {
    const today = new Date();
    const isNearDeadline = today.getDate() >= 20;
    return (
      <div className={`rounded-xl border p-5 flex items-start gap-4 ${isNearDeadline ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isNearDeadline ? 'bg-amber-100' : 'bg-gray-100'}`}>
          <svg className={`w-5 h-5 ${isNearDeadline ? 'text-amber-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Belum Ada Pengajuan Payroll</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {isNearDeadline
              ? 'Tanggal 26 semakin dekat! Segera ajukan payroll Anda.'
              : 'Ajukan payroll bulanan Anda sebelum tanggal 26.'}
          </p>
          <Link
            href="/payroll/create"
            className={`inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors ${
              isNearDeadline
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            }`}
          >
            Buat Pengajuan →
          </Link>
        </div>
      </div>
    );
  }

  const config = getPayrollStatusConfig(payroll.status);

  return (
    <Link href={`/payroll/${payroll.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${config.bgColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Payroll Terkini</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {getMonthName(payroll.period_month)} {payroll.period_year}
          </p>
          <span className={`mt-1.5 inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
            {config.label}
          </span>

          {payroll.status === 'revision_requested' && (
            <p className="mt-2 text-xs text-amber-700 font-medium">
              ⚠️ Atasan meminta revisi — tinjau logbook Anda lalu ajukan ulang.
            </p>
          )}
          {payroll.status === 'processed' && (
            <p className="mt-2 text-xs text-emerald-700 font-medium">
              Gaji periode ini telah dibayarkan. Unduh bukti transfer di halaman detail.
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/** Submission deadline reminder */
function DeadlineReminder() {
  const today = new Date();
  const day = today.getDate();
  const month = getMonthName(today.getMonth() + 1);

  if (day < 20 || day > 26) return null;

  const daysLeft = 26 - day;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl p-4 sm:px-5 sm:py-4 border ${daysLeft <= 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${daysLeft <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className={`text-sm font-bold ${daysLeft <= 0 ? 'text-red-900' : 'text-amber-900'}`}>
            {daysLeft <= 0
              ? 'Hari ini adalah batas pengajuan payroll!'
              : `${daysLeft} hari lagi batas pengajuan payroll bulan ${month}`}
          </p>
          <p className={`text-xs mt-0.5 ${daysLeft <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
            Jangan lupa mengajukan payroll sebelum tanggal 26 agar gaji Anda dapat diproses tepat waktu.
          </p>
        </div>
      </div>
      <Link
        href="/payroll"
        className={`self-start sm:self-auto flex-shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-md transition-colors ${
          daysLeft <= 0
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }`}
      >
        Cek Payroll
      </Link>
    </div>
  );
}

/** Quick Actions */
function QuickActions() {
  const actions = [
    { label: 'Tambah Logbook', href: '/logbook/create', icon: '✏️', description: 'Catat aktivitas kerja hari ini' },
    { label: 'Lihat Logbook', href: '/logbook', icon: '📋', description: 'Kelola semua catatan kerja' },
    { label: 'Laporan Rekap', href: '/recap', icon: '📊', description: 'Rekap bulanan & ekspor Excel' },
    { label: 'Pengajuan Payroll', href: '/payroll', icon: '💳', description: 'Kelola pengajuan gaji' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link key={a.href} href={a.href}>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-blue-200 transition-all group">
            <span className="text-2xl">{a.icon}</span>
            <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{a.label}</p>
            <p className="text-[11px] text-gray-500 leading-tight">{a.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<'director' | 'employee'>('employee');
  const [isDirector, setIsDirector] = useState(false);
  const [isRoleChecked, setIsRoleChecked] = useState(false);

  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.email || '');
        const hasDirectorRole = user.role?.name === 'direktur' || user.role?.name === 'superadmin';
        const hasDirectorPerm = user.role?.permissions?.some((p: any) => p.name === 'approve-payroll');
        if (hasDirectorRole || hasDirectorPerm) {
          setIsDirector(true);
          setActiveView('director');
        }
      }
    } catch {}
    setIsRoleChecked(true);
  }, []);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getEmployeeDashboard();
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoleChecked && activeView === 'employee') {
      fetchDashboard();
    }
  }, [isRoleChecked, activeView, fetchDashboard]);

  // Greeting berdasarkan jam
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

  if (!isRoleChecked) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Jika tampilan Direktur dipilih
  if (isDirector && activeView === 'director') {
    return (
      <div className="space-y-4">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveView('director')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-blue-700 shadow-sm"
          >
            👔 Tinjauan Direktur
          </button>
          <button
            onClick={() => setActiveView('employee')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
          >
            👤 Dashboard Pribadi (Karyawan)
          </button>
        </div>

        <DirectorDashboardView onSwitchView={() => setActiveView('employee')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
        <div className="text-red-500 text-4xl">⚠️</div>
        <p className="text-red-700 font-semibold">{error}</p>
        <button
          onClick={fetchDashboard}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg font-semibold transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { active_timer, current_month, latest_payroll, logbooks_needing_revision } = data;

  return (
    <div className="space-y-6">
      {/* Switcher Tab jika user adalah Direktur */}
      {isDirector && (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveView('director')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
          >
            👔 Tinjauan Direktur
          </button>
          <button
            onClick={() => setActiveView('employee')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-blue-700 shadow-sm"
          >
            👤 Dashboard Pribadi (Karyawan)
          </button>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto px-3.5 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Deadline Reminder (only shown near the 26th) */}
      <DeadlineReminder />

      {/* Active Timer Banner */}
      {active_timer && <ActiveTimerCard timer={active_timer} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Jam Kerja Bulan Ini"
          value={formatHours(current_month.total_hours)}
          subtitle={`${getMonthName(current_month.month)} ${current_month.year}`}
          accent="bg-blue-600"
          href="/recap"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Entri Logbook Bulan Ini"
          value={`${current_month.logbook_count} entri`}
          subtitle={`${getMonthName(current_month.month)} ${current_month.year}`}
          accent="bg-violet-600"
          href="/logbook"
          icon={
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <KpiCard
          title="Logbook Perlu Revisi"
          value={logbooks_needing_revision}
          subtitle={logbooks_needing_revision > 0 ? 'Perlu ditindaklanjuti' : 'Semua bersih ✓'}
          accent={logbooks_needing_revision > 0 ? 'bg-amber-500' : 'bg-green-600'}
          href="/logbook"
          icon={
            logbooks_needing_revision > 0 ? (
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        />
        <KpiCard
          title="Status Gaji Terkini"
          value={latest_payroll ? getPayrollStatusConfig(latest_payroll.status).label : 'Belum Ada'}
          subtitle={
            latest_payroll
              ? `${getMonthName(latest_payroll.period_month)} ${latest_payroll.period_year}`
              : 'Belum ada pengajuan'
          }
          accent={
            latest_payroll
              ? latest_payroll.status === 'processed'
                ? 'bg-emerald-600'
                : latest_payroll.status === 'revision_requested'
                ? 'bg-amber-500'
                : latest_payroll.status === 'rejected'
                ? 'bg-red-600'
                : 'bg-blue-600'
              : 'bg-gray-400'
          }
          href={latest_payroll ? `/payroll/${latest_payroll.id}` : '/payroll'}
          icon={
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Payroll Status + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll Status Card */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Status Pengajuan Payroll</h3>
          <PayrollStatusCard payroll={latest_payroll} />
        </div>

        {/* Work Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Ringkasan Kerja Bulan Ini</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {/* Hours progress bar — target 160 jam/bulan (40 jam/minggu × 4) */}
            {(() => {
              const targetHours = 160;
              const pct = Math.min((current_month.total_hours / targetHours) * 100, 100);
              const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">Progress Jam Kerja</span>
                    <span className="text-xs text-gray-500">{current_month.total_hours.toFixed(1)} / {targetHours} jam</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 text-right">{pct.toFixed(1)}% dari target bulan ini</p>
                </div>
              );
            })()}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Total Durasi</p>
                <p className="text-lg font-bold text-gray-900">{formatHours(current_month.total_hours)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Entri Logbook</p>
                <p className="text-lg font-bold text-gray-900">{current_month.logbook_count}</p>
              </div>
            </div>

            <Link
              href="/recap"
              className="block w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 py-1.5 border-t border-gray-100 transition-colors"
            >
              Lihat Rekap Lengkap & Ekspor Excel →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Akses Cepat</h3>
        <QuickActions />
      </div>
    </div>
  );
}
