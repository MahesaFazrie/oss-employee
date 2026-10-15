"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { directorService, DirectorPayroll } from '@/services/director';

export default function DirectorPayrollDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [payroll, setPayroll] = useState<DirectorPayroll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk modal aksi review
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await directorService.getPayrollDetail(id);
      setPayroll(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil detail pengajuan payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;

    setIsSubmittingAction(true);
    try {
      if (modalType === 'approve') {
        await directorService.approvePayroll(id, notes || undefined);
        alert('Payroll berhasil disetujui!');
      } else if (modalType === 'reject') {
        if (!notes.trim()) {
          alert('Alasan penolakan wajib diisi.');
          setIsSubmittingAction(false);
          return;
        }
        await directorService.rejectPayroll(id, notes.trim());
        alert('Payroll berhasil ditolak.');
      } else if (modalType === 'revision') {
        if (!notes.trim()) {
          alert('Catatan revisi wajib diisi.');
          setIsSubmittingAction(false);
          return;
        }
        await directorService.requestPayrollRevision(id, notes.trim());
        alert('Permintaan revisi berhasil dikirim ke karyawan.');
      }
      setModalType(null);
      setNotes('');
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses aksi pada payroll.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${current.className}`}>
        {current.label}
      </span>
    );
  };

  if (isLoading) {
    return <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">Memuat rincian payroll...</div>;
  }

  if (error || !payroll) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || 'Data payroll tidak ditemukan.'}</p>
        <Link href="/director/payrolls" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const canReview = ['submitted', 'under_review'].includes(payroll.status);

  return (
    <div className="bg-white shadow rounded-lg p-6 sm:p-8 border border-gray-100 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Pengajuan #{payroll.id} &bull; {getMonthName(payroll.period_month)} {payroll.period_year}
            </h2>
            {getStatusBadge(payroll.status)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Karyawan: <strong>{payroll.user?.name}</strong> ({payroll.user?.email})
          </p>
        </div>

        <Link
          href="/director/payrolls"
          className="text-sm text-gray-600 hover:text-gray-900 px-3.5 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          &larr; Kembali ke Daftar
        </Link>
      </div>

      {/* Decision Action Bar (If Reviewable) */}
      {canReview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-blue-900">Keputusan Persetujuan Direktur</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Tinjau rincian logbook di bawah sebelum memberikan persetujuan, permintaan revisi, atau penolakan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setModalType('approve'); setNotes(''); }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-semibold shadow transition-colors"
            >
              Setujui (Approve)
            </button>
            <button
              onClick={() => { setModalType('revision'); setNotes(''); }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-xs font-semibold shadow transition-colors"
            >
              Minta Revisi
            </button>
            <button
              onClick={() => { setModalType('reject'); setNotes(''); }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold shadow transition-colors"
            >
              Tolak (Reject)
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status Pengajuan</p>
          <div className="mt-1">{getStatusBadge(payroll.status)}</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Jam Kerja Terkunci</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            {formatDuration(payroll.total_duration_seconds)}
          </h3>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Jumlah Catatan Logbook</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            {payroll.total_entries !== null ? `${payroll.total_entries} entri` : '-'}
          </h3>
        </div>
      </div>

      {/* Snapshot Items Table */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Snapshot Pekerjaan Karyawan</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status Logbook</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payroll.snapshot_items && payroll.snapshot_items.length > 0 ? (
                payroll.snapshot_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700 font-medium">
                      {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-800">
                      <div className="font-semibold text-gray-900">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{item.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                      {Math.floor(item.duration_seconds / 60)} menit
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {item.logbook_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada rincian snapshot pekerjaan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status History Timeline */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Riwayat Perubahan Status (Audit Trail)</h3>
        {payroll.status_history && payroll.status_history.length > 0 ? (
          <div className="space-y-3">
            {payroll.status_history.map((h) => (
              <div key={h.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{h.changed_by?.name || 'Sistem'}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-600">
                      Mengubah status dari <strong>{h.from_status}</strong> &rarr; <strong className="text-blue-600">{h.to_status}</strong>
                    </span>
                  </div>
                  {h.notes && (
                    <div className="mt-1 text-gray-700 italic bg-white p-2 rounded border border-gray-100">
                      &ldquo;{h.notes}&rdquo;
                    </div>
                  )}
                </div>
                <div className="text-gray-400 whitespace-nowrap">
                  {new Date(h.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Belum ada riwayat perubahan status.</p>
        )}
      </div>

      {/* Modal Aksi Direktur */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {modalType === 'approve' && 'Setujui Pengajuan Payroll'}
              {modalType === 'revision' && 'Minta Revisi Payroll'}
              {modalType === 'reject' && 'Tolak Pengajuan Payroll'}
            </h3>

            <p className="text-xs text-gray-600">
              {modalType === 'approve' && 'Pengajuan akan disetujui untuk diteruskan ke tahap pembayaran.'}
              {modalType === 'revision' && 'Karyawan akan diminta untuk merevisi pengajuan ini.'}
              {modalType === 'reject' && 'Pengajuan akan ditolak secara permanen.'}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Catatan / Alasan {modalType !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  required={modalType !== 'approve'}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    modalType === 'approve'
                      ? 'Catatan persetujuan (opsional)...'
                      : 'Tuliskan alasan atau bagian yang perlu diperbaiki...'
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className={`px-5 py-2 text-white rounded-md text-sm font-semibold shadow disabled:opacity-50 ${
                    modalType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : modalType === 'revision'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmittingAction ? 'Memproses...' : 'Konfirmasi Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
