"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { directorService, DirectorPayroll } from '@/services/director';

export default function DirectorPayrollListPage() {
  const [payrolls, setPayrolls] = useState<DirectorPayroll[]>([]);
  const [activeTab, setActiveTab] = useState<string>('submitted');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await directorService.getPayrolls(activeTab === 'all' ? undefined : activeTab);
      setPayrolls(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar pengajuan payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [activeTab]);

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

  const filteredPayrolls = payrolls.filter((p) => {
    const matchSearch =
      (p.user?.name && p.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.user?.email && p.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Persetujuan & Review Payroll</h2>
          <p className="text-sm text-gray-500 mt-1">
            Panel Direktur untuk meninjau klaim jam kerja bulanan dan memberikan persetujuan pembayaran gaji.
          </p>
        </div>
        <button
          onClick={fetchPayrolls}
          className="px-3.5 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">{error}</div>
      )}

      {/* Tabs Filter */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'submitted', label: 'Perlu Review' },
            { id: 'all', label: 'Semua Pengajuan' },
            { id: 'under_review', label: 'Sedang Ditinjau' },
            { id: 'approved', label: 'Disetujui' },
            { id: 'revision_requested', label: 'Diminta Revisi' },
            { id: 'processed', label: 'Selesai Dibayar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Memuat pengajuan payroll...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Karyawan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Periode</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total Durasi</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Logbook</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Waktu Submit</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada pengajuan payroll pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{p.user?.name || `User #${p.user_id}`}</div>
                      <div className="text-xs text-gray-500">{p.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-800 font-medium">
                      {getMonthName(p.period_month)} {p.period_year}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700 font-medium">
                      {formatDuration(p.total_duration_seconds)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center text-gray-600">
                      {p.total_entries !== null ? `${p.total_entries} entri` : '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-xs">
                      {p.submitted_at
                        ? new Date(p.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/director/payrolls/${p.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                      >
                        Tinjau &rarr;
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
