"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { payrollService, PayrollPreview } from '@/services/payroll';

export default function CreatePayrollPage() {
  const router = useRouter();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [preview, setPreview] = useState<PayrollPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async (targetMonth = month, targetYear = year) => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const res = await payrollService.getPreview(targetMonth, targetYear);
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat preview data logbook periode ini.');
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview(month, year);
  }, [month, year]);

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const draftRes = await payrollService.createDraft(month, year);
      alert('Draft pengajuan payroll berhasil disimpan!');
      router.push(`/payroll/${draftRes.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan draft payroll.');
      setIsSubmitting(false);
    }
  };

  const handleDirectSubmit = async () => {
    if (!confirm('Apakah Anda yakin ingin langsung mengajukan payroll untuk periode ini? Snapshot pekerjaan akan dikunci.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Buat draft terlebih dahulu
      const draftRes = await payrollService.createDraft(month, year);
      // 2. Submit draft tersebut
      await payrollService.submitPayroll(draftRes.data.id);
      alert('Payroll berhasil diajukan untuk ditinjau oleh atasan!');
      router.push(`/payroll/${draftRes.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengajukan payroll.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 sm:p-8 border border-gray-100 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Form Pengajuan Payroll</h2>
          <p className="text-sm text-gray-500 mt-1">Pilih periode bulan dan tahun untuk melihat preview rekapitulasi pekerjaan sebelum diajukan.</p>
        </div>
        <Link
          href="/payroll"
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          &larr; Kembali ke Daftar
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Periode Selector */}
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Periode Penggajian</label>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-48">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={isSubmitting}
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={isSubmitting}
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
            >
              {[...Array(5)].map((_, i) => (
                <option key={currentDate.getFullYear() - i} value={currentDate.getFullYear() - i}>
                  {currentDate.getFullYear() - i}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchPreview(month, year)}
            disabled={isLoadingPreview}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            {isLoadingPreview ? 'Memuat...' : 'Refresh Preview'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {isLoadingPreview ? (
        <div className="text-center py-12 text-gray-500">Memuat preview data logbook periode ini...</div>
      ) : preview ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Total Jam Kerja Terhitung</p>
              <h3 className="text-3xl font-bold text-blue-900">{preview.summary.total_duration_formatted}</h3>
              <p className="text-xs text-blue-600 mt-1">({Math.floor(preview.summary.total_duration_seconds / 60)} total menit)</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">Total Entri Logbook</p>
              <h3 className="text-3xl font-bold text-indigo-900">{preview.summary.total_entries} <span className="text-base font-normal">tugas</span></h3>
              <p className="text-xs text-indigo-600 mt-1">Catatan kerja yang akan di-snapshot</p>
            </div>
          </div>

          {/* Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-3">
            <span className="text-amber-600 text-lg">ℹ️</span>
            <div>
              <p className="font-semibold">Perhatian Saat Mengajukan</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Ketika payroll diajukan (*Submit*), sistem akan membuat *snapshot* permanen dari seluruh logbook di atas. Logbook yang sudah masuk pengajuan tidak dapat diedit kembali.
              </p>
            </div>
          </div>

          {/* Table of Entries */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">Daftar Pekerjaan yang Tercakup:</h4>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Judul & Rincian</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">Durasi</th>
                    <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status Logbook</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.entries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada catatan logbook yang tercatat pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    preview.entries.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-700 font-medium">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 text-gray-800">
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                          {Math.floor(item.duration_seconds / 60)} menit
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-gray-100">
            <Link
              href="/payroll"
              className="w-full sm:w-auto text-center px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Batal
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || preview.entries.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan sebagai Draft'}
            </button>
            <button
              type="button"
              onClick={handleDirectSubmit}
              disabled={isSubmitting || preview.entries.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-sm shadow transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Langsung Ajukan (Submit)'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
