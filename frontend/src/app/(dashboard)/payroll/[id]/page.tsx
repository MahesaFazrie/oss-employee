"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { payrollService, PayrollSubmission, StatusHistoryItem } from '@/services/payroll';
import StatusTimeline from '@/components/StatusTimeline';

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [submission, setSubmission] = useState<PayrollSubmission | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isDownloadingProof, setIsDownloadingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [res, historyRes] = await Promise.all([
        payrollService.getSubmissionDetail(id),
        payrollService.getPayrollHistory(id).catch(() => ({ data: [] })),
      ]);
      setSubmission(res.data);
      setHistory(historyRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil detail payroll.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSubmitDraft = async () => {
    if (!confirm('Apakah Anda yakin ingin mengajukan payroll ini? Seluruh catatan kerja periode ini akan dikunci.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await payrollService.submitPayroll(id);
      alert('Payroll berhasil diajukan ke atasan!');
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengajukan payroll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!confirm('Apakah Anda yakin sudah memperbaiki catatan kerja dan ingin mengajukan ulang payroll ini? Snapshot akan diperbarui.')) {
      return;
    }

    setIsResubmitting(true);
    try {
      await payrollService.resubmitPayroll(id);
      alert('Payroll berhasil diajukan ulang setelah revisi!');
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengajukan ulang payroll.');
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleDownloadProof = async () => {
    setIsDownloadingProof(true);
    try {
      const blob = await payrollService.downloadPaymentProof(id);

      if (blob.type === 'application/json') {
        const text = await blob.text();
        const err = JSON.parse(text);
        alert(err.message || 'Bukti pembayaran belum tersedia.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bukti-transfer-payroll-${submission?.id || id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengunduh bukti pembayaran.');
    } finally {
      setIsDownloadingProof(false);
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
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500 border border-gray-100">
        Memuat detail pengajuan payroll...
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="bg-white shadow rounded-lg p-8 border border-gray-100 max-w-xl mx-auto text-center space-y-4">
        <div className="text-red-500 text-lg font-semibold">{error || 'Data pengajuan payroll tidak ditemukan.'}</div>
        <Link
          href="/payroll"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium"
        >
          Kembali ke Daftar Payroll
        </Link>
      </div>
    );
  }

  // Ambil catatan revisi terbaru jika ada
  const latestRevisionNote = history
    .slice()
    .reverse()
    .find((h) => h.to_status === 'revision_requested')?.notes;

  return (
    <div className="bg-white shadow rounded-lg p-6 sm:p-8 border border-gray-100 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Periode: {getMonthName(submission.period_month)} {submission.period_year}
            </h2>
            {getStatusBadge(submission.status)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ID Pengajuan: #{submission.id} &bull; Dibuat pada {new Date(submission.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <Link
          href="/payroll"
          className="text-sm text-gray-600 hover:text-gray-900 px-3.5 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          &larr; Kembali ke Daftar
        </Link>
      </div>

      {/* Revision Requested Notice Banner */}
      {submission.status === 'revision_requested' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-orange-600 text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-900">Pengajuan Ini Memerlukan Revisi dari Atasan</h4>
              {latestRevisionNote ? (
                <div className="mt-2 bg-white p-3 rounded border border-orange-200 text-xs text-orange-950">
                  <strong>Catatan dari Atasan:</strong>
                  <p className="mt-0.5 whitespace-pre-wrap italic">&ldquo;{latestRevisionNote}&rdquo;</p>
                </div>
              ) : (
                <p className="text-xs text-orange-700 mt-0.5">
                  Atasan meminta Anda untuk meninjau dan memperbaiki logbook pada periode ini.
                </p>
              )}
              <p className="text-xs text-orange-800 mt-2">
                Setelah Anda memperbaiki catatan di menu <strong>Logbook Saya</strong>, klik tombol di bawah untuk membuat snapshot baru dan mengirimkannya kembali ke atasan.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-orange-200">
            <button
              onClick={handleResubmit}
              disabled={isResubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow transition-colors disabled:opacity-50"
            >
              {isResubmitting ? 'Mengirim Ulang...' : 'Ajukan Ulang Payroll (Resubmit)'}
            </button>
          </div>
        </div>
      )}

      {/* Draft Action Banner */}
      {submission.status === 'draft' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-blue-900">Pengajuan Masih Berstatus Draft</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Klik tombol di samping untuk mengunci catatan logbook dan mengirimkan pengajuan ke atasan untuk ditinjau.
            </p>
          </div>
          <button
            onClick={handleSubmitDraft}
            disabled={isSubmitting}
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Ajukan Sekarang (Submit)'}
          </button>
        </div>
      )}

      {/* Processed Payment Notice Banner for Employee */}
      {submission.status === 'processed' && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-900">Gaji Telah Selesai Dibayarkan</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Penggajian untuk periode ini telah diverifikasi dan diselesaikan oleh Direktur. Anda dapat mengunduh bukti transfer resmi melalui tombol di samping.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadProof}
            disabled={isDownloadingProof}
            className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow transition-colors disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isDownloadingProof ? 'Mengunduh...' : 'Unduh Bukti Transfer'}
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status Saat Ini</p>
          <div className="mt-1">{getStatusBadge(submission.status)}</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Jam Kerja Terkunci</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            {formatDuration(submission.total_duration_seconds)}
          </h3>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Entri Logbook</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            {submission.total_entries !== null ? `${submission.total_entries} entri` : '-'}
          </h3>
        </div>
      </div>

      {/* Snapshot Items Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Snapshot Catatan Kerja</h3>
          <span className="text-xs text-gray-500">
            {submission.snapshot_items?.length || 0} entri tersimpan
          </span>
        </div>

        {submission.status === 'draft' && (!submission.snapshot_items || submission.snapshot_items.length === 0) ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-500">
            Snapshot catatan kerja akan dibuat dan dikunci secara otomatis saat Anda menekan tombol <strong>Ajukan Sekarang</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Judul & Pekerjaan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status Asal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submission.snapshot_items && submission.snapshot_items.length > 0 ? (
                  submission.snapshot_items.map((item) => (
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
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
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
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      Tidak ada entri snapshot ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status History (Audit Trail) */}
      <div className="pt-4 border-t border-gray-100">
        <StatusTimeline history={history} title="Riwayat Status & Catatan Peninjau" />
      </div>
    </div>
  );
}
