"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { directorService, DirectorPayroll, PaymentProofInfo } from '@/services/director';
import StatusTimeline from '@/components/StatusTimeline';

export default function DirectorPayrollDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [payroll, setPayroll] = useState<DirectorPayroll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk modal aksi review awal (approve, reject, revision)
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // State untuk Pemrosesan Pembayaran (OSS-503)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<PaymentProofInfo | null>(null);
  const [processingNotes, setProcessingNotes] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDownloadingProof, setIsDownloadingProof] = useState(false);
  const [isReplacingProof, setIsReplacingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert('Payroll berhasil disetujui! Silakan lanjutkan ke tahap pengunggahan bukti pembayaran.');
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

  // Validasi & pemilihan file bukti bayar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak didukung. Harap pilih file PDF, JPG, atau PNG.');
      setSelectedFile(null);
      return;
    }

    // Maksimal 5 MB = 5 * 1024 * 1024 bytes
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file melebihi batas maksimal 5 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Upload bukti bayar
  const handleUploadProof = async () => {
    if (!selectedFile) {
      setFileError('Silakan pilih file bukti pembayaran terlebih dahulu.');
      return;
    }

    setIsUploadingProof(true);
    setFileError(null);
    try {
      const res = await directorService.uploadPaymentProof(id, selectedFile);
      setUploadedProof(res.data);
      setIsReplacingProof(false);
      alert('Bukti pembayaran berhasil diunggah! Anda sekarang dapat menandai payroll sebagai selesai dibayar (processed).');
      fetchDetail();
    } catch (err: any) {
      setFileError(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Tandai payroll selesai dibayar (mark as processed)
  const handleMarkProcessed = async () => {
    if (!uploadedProof && payroll?.status !== 'processed') {
      alert('Harap unggah bukti pembayaran terlebih dahulu sebelum menandai payroll selesai.');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menandai pengajuan payroll ini sebagai SELESAI DIBAYAR (Processed)?')) {
      return;
    }

    setIsProcessingPayment(true);
    try {
      await directorService.markPayrollProcessed(id, processingNotes || undefined);
      alert('Payroll berhasil ditandai sebagai Selesai Dibayar (Processed)!');
      setProcessingNotes('');
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menandai payroll sebagai processed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Download bukti bayar
  const handleDownloadProof = async () => {
    setIsDownloadingProof(true);
    try {
      const blob = await directorService.downloadPaymentProof(id);

      // Cek jika response ternyata JSON error (dibungkus Blob karena responseType: 'blob')
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const err = JSON.parse(text);
        alert(err.message || 'Bukti pembayaran belum tersedia.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedProof?.original_name || `bukti-pembayaran-payroll-${payroll?.id || id}`;
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
  const isApproved = payroll.status === 'approved';
  const isProcessed = payroll.status === 'processed';

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

      {/* Payment Processing Section (OSS-503: For Approved & Processed Statuses) */}
      {(isApproved || isProcessed) && (
        <div
          className={`rounded-xl border p-6 space-y-6 ${
            isProcessed
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
          }`}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200/60 gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  isProcessed ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {isProcessed ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isProcessed ? 'Pembayaran Telah Selesai Diproses' : 'Pemrosesan Pembayaran Gaji'}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isProcessed
                    ? 'Gaji periode ini telah berhasil dibayarkan dan ditandai selesai.'
                    : 'Pengajuan telah disetujui. Silakan unggah bukti transfer pembayaran sebelum menyelesaikan payroll.'}
                </p>
              </div>
            </div>

            {/* Tombol Unduh Bukti Bayar */}
            <button
              type="button"
              onClick={handleDownloadProof}
              disabled={isDownloadingProof}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md shadow-sm flex items-center gap-2 self-start sm:self-auto transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isDownloadingProof ? 'Mengunduh...' : 'Unduh Bukti Transfer'}
            </button>
          </div>

          {/* Form Pembayaran (Ketika masih approved, atau ketika ingin mengganti bukti) */}
          {(isApproved || isReplacingProof) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              {/* Step 1: Upload Bukti Transfer */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-gray-800">
                    Unggah Bukti Transfer / Pembayaran <span className="text-red-500">*</span>
                  </h4>
                </div>
                <p className="text-xs text-gray-500">
                  Format yang didukung: <strong>PDF, PNG, JPG</strong> (maksimal 5 MB).
                </p>

                {/* Upload Zone */}
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-4 text-center bg-gray-50/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-proof-input"
                  />
                  <label htmlFor="payment-proof-input" className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 mx-auto text-gray-400 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-blue-600 hover:underline">Pilih file bukti bayar</span> atau tarik ke sini
                    </div>
                  </label>

                  {/* Preview file yang dipilih */}
                  {selectedFile && (
                    <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded text-xs flex items-center justify-between text-blue-900">
                      <div className="truncate mr-2 font-medium">
                        📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>

                {fileError && <p className="text-xs text-red-600 font-medium">{fileError}</p>}

                {/* Tombol Simpan Bukti */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUploadProof}
                    disabled={!selectedFile || isUploadingProof}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploadingProof ? 'Mengunggah...' : 'Unggah Bukti Pembayaran'}
                  </button>
                  {isReplacingProof && (
                    <button
                      type="button"
                      onClick={() => setIsReplacingProof(false)}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {uploadedProof && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Bukti aktif: <strong>{uploadedProof.original_name}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Konfirmasi Selesai Dibayar (Mark Processed) */}
              <div className="space-y-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-4 lg:pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white rounded-full text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-gray-800">
                      Tandai Pembayaran Selesai (Mark Processed)
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500">
                    Selesaikan proses penggajian setelah transfer bank berhasil dilakukan.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Catatan Pembayaran / Nomor Referensi (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={processingNotes}
                      onChange={(e) => setProcessingNotes(e.target.value)}
                      placeholder="Contoh: Ditransfer via BCA no. ref TRX-98239 tanggal 27 Agustus 2026..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-900 bg-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleMarkProcessed}
                    disabled={isProcessingPayment || isUploadingProof}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? 'Memproses...' : 'Tandai Pembayaran Selesai (Processed)'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">
                    * Status akan dikunci dan notifikasi pembayaran dikirimkan ke karyawan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ketika status sudah processed dan tidak sedang mode replace */}
          {isProcessed && !isReplacingProof && (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-emerald-200">
              <div className="text-xs text-gray-700">
                <span className="font-semibold text-emerald-800">Status Pembayaran:</span> Pembayaran gaji karyawan telah berhasil diverifikasi dan diselesaikan.
              </div>
              <button
                type="button"
                onClick={() => setIsReplacingProof(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Ganti / Unggah Ulang Bukti Transfer
              </button>
            </div>
          )}
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
      <div className="pt-4 border-t border-gray-100">
        <StatusTimeline history={payroll.status_history || []} title="Riwayat Perubahan Status (Audit Trail)" />
      </div>

      {/* Modal Aksi Direktur (Approve / Reject / Revision) */}
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
