"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { auditLogService, AuditLogItem, AuditLogPagination, AuditLogFilters } from '@/services/auditLog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatEntityName(entityType: string): string {
  if (!entityType) return '-';
  const parts = entityType.split('\\');
  const base = parts[parts.length - 1];
  // Format camelCase to readable words
  return base.replace(/([A-Z])/g, ' $1').trim();
}

function getActionBadge(action: string): { label: string; bg: string; text: string } {
  switch (action.toLowerCase()) {
    case 'created':
      return { label: 'Dibuat', bg: 'bg-green-100', text: 'text-green-800' };
    case 'updated':
      return { label: 'Diubah', bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'deleted':
      return { label: 'Dihapus', bg: 'bg-red-100', text: 'text-red-800' };
    default:
      return { label: action, bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

// ─── Modal Detail Perubahan ───────────────────────────────────────────────────

function ChangesModal({
  log,
  onClose,
}: {
  log: AuditLogItem;
  onClose: () => void;
}) {
  const changes = log.changes || {};
  const before = changes.before || {};
  const after = changes.after || {};

  // Ambil semua keys dari before dan after
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Detail Perubahan — {formatEntityName(log.entity_type)} #{log.entity_id}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Aksi <span className="font-semibold text-gray-700">{log.action.toUpperCase()}</span> oleh{' '}
              <span className="font-semibold text-gray-700">{log.user?.name || 'Sistem'}</span> pada {formatDate(log.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-400 block">ID Log:</span>
              <span className="font-semibold text-gray-800">#{log.id}</span>
            </div>
            <div>
              <span className="text-gray-400 block">IP Address:</span>
              <span className="font-semibold text-gray-800">{log.ip_address || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Aktor:</span>
              <span className="font-semibold text-gray-800">{log.user?.name || 'Sistem'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Email:</span>
              <span className="font-semibold text-gray-800 truncate block">{log.user?.email || '-'}</span>
            </div>
          </div>

          {allKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Tidak ada catatan perubahan data spesifik untuk aktivitas ini.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4 w-1/3">Kolom / Field</th>
                    <th className="py-2.5 px-4 w-1/3 text-red-700 bg-red-50/50">Nilai Sebelum (Before)</th>
                    <th className="py-2.5 px-4 w-1/3 text-green-700 bg-green-50/50">Nilai Sesudah (After)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {allKeys.map((key) => {
                    const beforeVal = before[key];
                    const afterVal = after[key];
                    const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                    return (
                      <tr key={key} className={isChanged ? 'bg-amber-50/30' : ''}>
                        <td className="py-2.5 px-4 font-semibold text-gray-800 font-sans">
                          {key}
                        </td>
                        <td className="py-2.5 px-4 text-red-800 bg-red-50/30 break-all">
                          {beforeVal !== undefined && beforeVal !== null
                            ? typeof beforeVal === 'object'
                              ? JSON.stringify(beforeVal)
                              : String(beforeVal)
                            : <span className="text-gray-400 font-sans italic">null</span>}
                        </td>
                        <td className="py-2.5 px-4 text-green-800 bg-green-50/30 break-all">
                          {afterVal !== undefined && afterVal !== null
                            ? typeof afterVal === 'object'
                              ? JSON.stringify(afterVal)
                              : String(afterVal)
                            : <span className="text-gray-400 font-sans italic">null</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<AuditLogPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Filters state
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal detail
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Check permission
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isSuperadmin = user.role?.name === 'superadmin';
        const isDirector = user.role?.name === 'direktur';
        const hasViewReports = user.role?.permissions?.some((p: any) => p.name === 'view-reports');
        if (isSuperadmin || isDirector || hasViewReports) {
          setIsAuthorized(true);
          return;
        }
      }
      setIsAuthorized(false);
    } catch {
      setIsAuthorized(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: AuditLogFilters = {
        page: currentPage,
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      const res = await auditLogService.getAuditLogs(filters);
      if (res.success && res.data) {
        setLogs(res.data.items || []);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat log audit.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs();
    }
  }, [isAuthorized, fetchLogs]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilter = () => {
    setActionFilter('');
    setEntityFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  if (isAuthorized === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
        <div className="text-red-500 text-4xl">🚫</div>
        <h3 className="text-lg font-bold text-red-900">Akses Dibatasi</h3>
        <p className="text-sm text-red-700">
          Anda tidak memiliki izin (permission <code className="font-mono bg-red-100 px-1 py-0.5 rounded">view-reports</code>) untuk mengakses halaman Audit Logs sistem.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-gray-900">Audit Logs Sistem</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Audit Trail
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Jejak rekaman aktivitas, perubahan data, dan riwayat mutasi dalam sistem One Stop Service
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto px-3.5 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        {/* Entitas */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Entitas</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Entitas</option>
            <option value="PayrollSubmission">Payroll Submission</option>
            <option value="Logbook">Logbook Kerja</option>
            <option value="PaymentProof">Bukti Pembayaran</option>
            <option value="User">User / Akun</option>
          </select>
        </div>

        {/* Aksi */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Aksi</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Aksi</option>
            <option value="created">Dibuat (Created)</option>
            <option value="updated">Diubah (Updated)</option>
            <option value="deleted">Dihapus (Deleted)</option>
          </select>
        </div>

        {/* Tanggal Dari */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tanggal Sampai */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="flex-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors shadow-sm"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleResetFilter}
            className="text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 px-3 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-5">Waktu</th>
                <th className="py-3 px-5">Pengguna / Aktor</th>
                <th className="py-3 px-5">Aksi</th>
                <th className="py-3 px-5">Entitas & ID</th>
                <th className="py-3 px-5">IP Address</th>
                <th className="py-3 px-5 text-right">Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-5"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="py-3.5 px-5"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="py-3.5 px-5 text-right"><div className="h-6 bg-gray-200 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="text-3xl mb-2">📜</div>
                    <p className="font-semibold text-gray-600">Tidak ada log audit ditemukan</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Coba sesuaikan filter pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actBadge = getActionBadge(log.action);
                  const initial = log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'S';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      {/* Waktu */}
                      <td className="py-3.5 px-5 font-medium text-gray-800 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {log.user?.name || 'Sistem / Guest'}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {log.user?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${actBadge.bg} ${actBadge.text}`}>
                          {actBadge.label}
                        </span>
                      </td>

                      {/* Entitas */}
                      <td className="py-3.5 px-5 font-medium text-gray-900">
                        <span className="font-semibold">{formatEntityName(log.entity_type)}</span>
                        <span className="ml-1 text-gray-400 font-mono text-[11px]">#{log.entity_id}</span>
                      </td>

                      {/* IP */}
                      <td className="py-3.5 px-5 text-gray-500 font-mono text-[11px]">
                        {log.ip_address || '-'}
                      </td>

                      {/* Changes Button */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 transition-colors"
                        >
                          <span>Lihat Perubahan</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
            <p className="text-gray-500">
              Menampilkan halaman <span className="font-semibold text-gray-800">{pagination.current_page}</span> dari{' '}
              <span className="font-semibold text-gray-800">{pagination.last_page}</span> (total {pagination.total} log)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg font-semibold bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Changes Modal */}
      {selectedLog && (
        <ChangesModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
