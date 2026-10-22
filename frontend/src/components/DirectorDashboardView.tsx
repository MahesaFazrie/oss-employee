"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { dashboardService, DirectorDashboardData } from '@/services/dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthName(month: number): string {
  return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  return `${hours.toFixed(1)} jam`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
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
  badgeText,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
  badgeText?: string;
}) {
  const content = (
    <div
      className={`relative bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow overflow-hidden ${
        href ? 'cursor-pointer group' : ''
      }`}
    >
      {/* Accent left border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accent}`} />

      <div
        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${accent
          .replace('bg-', 'bg-opacity-10 bg-')
          .replace('-600', '-100')
          .replace('-500', '-100')}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</p>
          {badgeText && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">
              {badgeText}
            </span>
          )}
        </div>
        <p className="mt-1 text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>

      {href && (
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0 mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/** Monthly Work Hours Bar Chart */
function MonthlyWorkHoursChart({ data }: { data: DirectorDashboardData['monthly_work_hours'] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        Belum ada data jam kerja untuk ditampilkan.
      </div>
    );
  }

  const maxHours = Math.max(...data.map((d) => d.total_hours), 1);
  const totalHoursAll = data.reduce((acc, cur) => acc + cur.total_hours, 0);
  const avgHours = (totalHoursAll / data.length).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Tren Jam Kerja Seluruh Karyawan</h3>
          <p className="text-xs text-gray-500 mt-0.5">Akumulasi total jam kerja logbook selama 6 bulan terakhir</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <span className="text-gray-500">Rata-rata: </span>
            <span className="font-bold text-blue-700">{avgHours} jam/bulan</span>
          </div>
          <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            <span className="text-gray-500">Total 6 Bln: </span>
            <span className="font-bold text-indigo-700">{totalHoursAll.toFixed(1)} jam</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="pt-4">
        <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 px-2">
          {data.map((item, idx) => {
            const heightPct = Math.max(Math.round((item.total_hours / maxHours) * 100), 6);
            const isLatest = idx === data.length - 1;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1 shadow-lg whitespace-nowrap pointer-events-none transition-all">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-blue-200">{item.total_hours.toFixed(1)} jam ({item.total_duration_seconds.toLocaleString('id-ID')} dtk)</p>
                  </div>
                )}

                {/* Value label on top of bar */}
                <span className={`text-[11px] font-semibold mb-1.5 transition-colors ${isHovered || isLatest ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                  {item.total_hours.toFixed(1)}j
                </span>

                {/* Bar */}
                <div className="w-full max-w-[48px] bg-gray-100 rounded-t-lg overflow-hidden flex items-end h-40">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isLatest
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-600 shadow-md'
                        : isHovered
                        ? 'bg-gradient-to-t from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-t from-blue-400 to-blue-500 opacity-80 group-hover:opacity-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                {/* X-axis Label */}
                <span className={`text-[11px] mt-2 font-medium truncate max-w-[64px] text-center ${isLatest ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Recent Payroll Activity Table */
function RecentPayrollTable({ payrolls }: { payrolls: DirectorDashboardData['recent_payrolls'] }) {
  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-gray-300 text-4xl mb-2">📋</div>
        <p className="text-sm font-semibold text-gray-700">Belum ada pengajuan payroll</p>
        <p className="text-xs text-gray-500 mt-1">Pengajuan baru dari karyawan akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Aktivitas Pengajuan Payroll Terkini</h3>
          <p className="text-xs text-gray-500 mt-0.5">5 pengajuan payroll terbaru yang masuk ke sistem</p>
        </div>
        <Link
          href="/director/payrolls"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          Lihat Semua →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-100">
            <tr>
              <th className="py-3 px-6">Karyawan</th>
              <th className="py-3 px-6">Periode</th>
              <th className="py-3 px-6">Tanggal Diajukan</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payrolls.map((p) => {
              const statusCfg = getPayrollStatusConfig(p.status);
              const initial = p.user?.name ? p.user.name.charAt(0).toUpperCase() : '?';

              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Karyawan */}
                  <td className="py-3.5 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                        {initial}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{p.user?.name || 'Karyawan'}</p>
                        <p className="text-[11px] text-gray-400">ID #{p.user?.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Periode */}
                  <td className="py-3.5 px-6 font-medium text-gray-800">
                    {getMonthName(p.period_month)} {p.period_year}
                  </td>

                  {/* Tanggal */}
                  <td className="py-3.5 px-6 text-gray-500">
                    {formatDate(p.created_at)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.bgColor} ${statusCfg.textColor}`}>
                      <span>{statusCfg.icon}</span>
                      <span>{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      href={`/director/payrolls/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 transition-colors"
                    >
                      Review
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Quick Action Hub */
function DirectorQuickActions({ data }: { data: DirectorDashboardData }) {
  const actions = [
    {
      title: 'Verifikasi Logbook',
      href: '/director/logbooks',
      icon: '📝',
      desc: 'Tinjau & verifikasi catatan kerja karyawan',
      badge: data.logbooks_pending_review > 0 ? `${data.logbooks_pending_review} pending` : undefined,
      color: 'hover:border-amber-300 hover:bg-amber-50/30',
    },
    {
      title: 'Approval Payroll',
      href: '/director/payrolls',
      icon: '💳',
      desc: 'Setujui atau tolak pengajuan gaji karyawan',
      badge: data.payrolls_pending_approval > 0 ? `${data.payrolls_pending_approval} diajukan` : undefined,
      color: 'hover:border-blue-300 hover:bg-blue-50/30',
    },
    {
      title: 'Proses Pembayaran Gaji',
      href: '/director/payrolls',
      icon: '💰',
      desc: 'Upload bukti transfer gaji yang disetujui',
      badge: data.payrolls_pending_processing > 0 ? `${data.payrolls_pending_processing} siap bayar` : undefined,
      color: 'hover:border-emerald-300 hover:bg-emerald-50/30',
    },
    {
      title: 'Laporan & Rekap Kerja',
      href: '/recap',
      icon: '📊',
      desc: 'Analisis rekap jam kerja & ekspor laporan',
      color: 'hover:border-purple-300 hover:bg-purple-50/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => (
        <Link key={act.title} href={act.href}>
          <div className={`bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all group ${act.color}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{act.icon}</span>
                {act.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                    {act.badge}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{act.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Buka Menu</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Director View ───────────────────────────────────────────────────────

export default function DirectorDashboardView({
  onSwitchView,
}: {
  onSwitchView?: () => void;
}) {
  const [data, setData] = useState<DirectorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDirectorDashboard();
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard direktur.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || '');
      }
    } catch {}
  }, [fetchDashboard]);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-80 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-56 bg-gray-200 rounded-xl" />
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

  const hasUrgentActions =
    data.payrolls_pending_approval > 0 ||
    data.payrolls_pending_processing > 0 ||
    data.logbooks_pending_review > 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900">
              {greeting}{userName ? `, Pak/Ibu ${userName.split(' ')[0]}` : ''}! 👔
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Direktur
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} — Ringkasan eksekutif dan manajemen seluruh karyawan
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onSwitchView && (
            <button
              onClick={onSwitchView}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <span>👤</span>
              Lihat Dashboard Pribadi
            </button>
          )}
          <button
            onClick={fetchDashboard}
            className="px-3.5 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Action Required Alert Banner */}
      {hasUrgentActions && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-xl">
              ⚡
            </div>
            <div>
              <p className="text-sm font-bold">Perhatian: Memerlukan Tindakan Anda</p>
              <p className="text-xs text-amber-100 mt-0.5">
                {[
                  data.payrolls_pending_approval > 0 && `${data.payrolls_pending_approval} payroll menunggu approval`,
                  data.payrolls_pending_processing > 0 && `${data.payrolls_pending_processing} payroll siap transfer`,
                  data.logbooks_pending_review > 0 && `${data.logbooks_pending_review} logbook menunggu verifikasi`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {data.payrolls_pending_approval > 0 && (
              <Link
                href="/director/payrolls"
                className="bg-white text-amber-900 text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
              >
                Approval Payroll →
              </Link>
            )}
            {data.logbooks_pending_review > 0 && (
              <Link
                href="/director/logbooks"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors border border-white/30"
              >
                Verifikasi Logbook →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Logbooks Pending Review */}
        <KpiCard
          title="Logbook Menunggu Review"
          value={data.logbooks_pending_review}
          subtitle="Catatan kerja butuh verifikasi"
          accent="bg-amber-500"
          href="/director/logbooks"
          badgeText={data.logbooks_pending_review > 0 ? `${data.logbooks_pending_review} Baru` : undefined}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />

        {/* KPI 2: Payrolls Pending Approval */}
        <KpiCard
          title="Payroll Menunggu Approval"
          value={data.payrolls_pending_approval}
          subtitle="Pengajuan gaji status diajukan"
          accent="bg-blue-600"
          href="/director/payrolls"
          badgeText={data.payrolls_pending_approval > 0 ? 'Urgent' : undefined}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* KPI 3: Payrolls Pending Processing */}
        <KpiCard
          title="Payroll Siap Ditransfer"
          value={data.payrolls_pending_processing}
          subtitle="Disetujui, siap upload bukti transfer"
          accent="bg-emerald-600"
          href="/director/payrolls"
          badgeText={data.payrolls_pending_processing > 0 ? 'Siap Bayar' : undefined}
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        {/* KPI 4: Total Active Employees */}
        <KpiCard
          title="Total Karyawan Aktif"
          value={`${data.total_active_employees} Orang`}
          subtitle="Terdaftar aktif di sistem"
          accent="bg-purple-600"
          href="/director/logbooks"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* Monthly Work Hours Chart */}
      <MonthlyWorkHoursChart data={data.monthly_work_hours} />

      {/* Recent Payroll Activity Table */}
      <RecentPayrollTable payrolls={data.recent_payrolls} />

      {/* Quick Action Hub */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Akses Cepat Manajemen</h3>
        <DirectorQuickActions data={data} />
      </div>
    </div>
  );
}
