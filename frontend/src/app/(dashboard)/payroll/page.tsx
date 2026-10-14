"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { payrollService, PayrollSubmission } from '@/services/payroll';

export default function PayrollPage() {
  const [submissions, setSubmissions] = useState<PayrollSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await payrollService.getSubmissions();
      setSubmissions(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar pengajuan payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} jam ${m} menit`;
    return `${m} menit`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: 'Diajukan', className: 'bg-blue-100 text-blue-800' },
      under_review: { label: 'Sedang Ditinjau', className: 'bg-purple-100 text-purple-800' },
      revision_requested: { label: 'Perlu Revisi', className: 'bg-orange-100 text-orange-800' },
      approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
      processed: { label: 'Telah Dibayar', className: 'bg-emerald-100 text-emerald-800' },
    };

    const current = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${current.className}`}>
        {current.label}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Riwayat Pengajuan Payroll</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar pengajuan klaim gaji berdasarkan rekapitulasi kerja bulanan Anda.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSubmissions}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Refresh
          </button>
          <Link
            href="/payroll/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>+</span> Ajukan Payroll Baru
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat data payroll...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Periode</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Durasi</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Entri Logbook</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Waktu Pengajuan</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="max-w-sm mx-auto text-center space-y-3">
                      <p className="text-gray-600 font-medium">Belum ada riwayat pengajuan payroll.</p>
                      <p className="text-xs text-gray-400">Pastikan Anda sudah mengisi logbook kerja bulan ini sebelum mengajukan payroll.</p>
                      <Link
                        href="/payroll/create"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-medium"
                      >
                        Mulai Buat Pengajuan
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {getMonthName(sub.period_month)} {sub.period_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDuration(sub.total_duration_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                      {sub.total_entries !== null ? `${sub.total_entries} entri` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : sub.status === 'draft'
                        ? 'Masih Draft'
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/payroll/${sub.id}`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Detail &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
