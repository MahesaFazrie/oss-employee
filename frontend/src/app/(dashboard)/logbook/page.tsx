"use client";

import { useState, useEffect } from 'react';
import { logbookService } from '@/services/work';
import Link from 'next/link';

export default function LogbookPage() {
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk modal diskusi/komentar masukan
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  // State untuk modal edit revisi
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    duration_minutes: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const fetchLogbooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await logbookService.getLogbooks();
      setLogbooks(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat catatan logbook.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCommentModal = async (log: any) => {
    setSelectedLogbook(log);
    setCommentModalOpen(true);
    setNewComment('');
    setIsLoadingComments(true);
    try {
      const res = await logbookService.getComments(log.id);
      setComments(res.data || []);
    } catch (err) {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogbook || !newComment.trim()) return;

    setIsSendingComment(true);
    try {
      await logbookService.addComment(selectedLogbook.id, newComment.trim());
      setNewComment('');
      // Reload comments
      const res = await logbookService.getComments(selectedLogbook.id);
      setComments(res.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengirim balasan komentar.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const openEditModal = (log: any) => {
    setSelectedLogbook(log);
    setEditFormData({
      title: log.title || '',
      description: log.description || '',
      duration_minutes: String(Math.floor((log.duration_seconds || 0) / 60) || 60),
    });
    setEditModalOpen(true);
  };

  const handleUpdateLogbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogbook) return;

    setIsUpdating(true);
    try {
      const payload: any = {
        title: editFormData.title,
        description: editFormData.description,
        duration_seconds: parseInt(editFormData.duration_minutes) * 60,
      };

      await logbookService.updateLogbook(selectedLogbook.id, payload);
      alert('Catatan logbook berhasil diperbarui!');
      setEditModalOpen(false);
      fetchLogbooks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memperbarui logbook.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getVerificationBadge = (vStatus: string) => {
    switch (vStatus) {
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Terverifikasi</span>;
      case 'revision_requested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Perlu Revisi</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Menunggu Verifikasi</span>;
    }
  };

  const revisionCount = logbooks.filter((l) => l.verification_status === 'revision_requested').length;

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Catatan Logbook Saya</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar aktivitas pekerjaan harian dan status verifikasi dari atasan.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogbooks}
            className="px-3.5 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            Refresh
          </button>
          <Link
            href="/logbook/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
          >
            + Tambah Logbook
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{error}</div>
      )}

      {/* Revision Alert Banner */}
      {revisionCount > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md flex items-start gap-3">
          <span className="text-orange-600 text-xl">⚠️</span>
          <div>
            <h4 className="text-sm font-bold text-orange-900">Perhatian: Permintaan Revisi dari Atasan</h4>
            <p className="text-xs text-orange-700 mt-0.5">
              Terdapat <strong>{revisionCount} logbook</strong> yang diminta revisi oleh atasan. Klik tombol <strong>Masukan / Revisi</strong> untuk melihat rincian catatan dan memperbaiki logbook Anda.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat catatan logbook...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status Verifikasi</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Masukan & Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logbooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Anda belum memiliki catatan logbook.</p>
                      <Link href="/logbook/create" className="text-blue-600 hover:underline text-xs">
                        Buat catatan logbook pertama Anda sekarang &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                logbooks.map((log: any) => {
                  const isRevision = log.verification_status === 'revision_requested';
                  return (
                    <tr key={log.id} className={`hover:bg-gray-50 ${isRevision ? 'bg-orange-50/50' : ''}`}>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-700 font-medium">
                        {new Date(log.date || log.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-gray-900 max-w-md">
                        <div className="font-semibold">{log.title}</div>
                        {log.description && (
                          <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap line-clamp-2">{log.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {Math.floor((log.duration_seconds || 0) / 60)} menit
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {getVerificationBadge(log.verification_status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        {/* Tombol Diskusi / Komentar Feedback */}
                        <button
                          onClick={() => openCommentModal(log)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                            isRevision
                              ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                          }`}
                        >
                          {isRevision ? '💬 Lihat Masukan' : 'Diskusi'}
                        </button>

                        {/* Tombol Edit jika masih draft atau diminta revisi */}
                        {(log.status === 'draft' || isRevision) && (
                          <button
                            onClick={() => openEditModal(log)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Masukan & Diskusi (Feedback) */}
      {commentModalOpen && selectedLogbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Masukan & Diskusi Atasan</h3>
              <button onClick={() => setCommentModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="text-xs bg-gray-50 p-3 rounded text-gray-700 space-y-1">
              <p>Tugas: <strong>{selectedLogbook.title}</strong></p>
              <div className="flex items-center gap-2">
                <span>Status Verifikasi:</span>
                {getVerificationBadge(selectedLogbook.verification_status)}
              </div>
            </div>

            {/* List Komentar */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px]">
              {isLoadingComments ? (
                <div className="text-center py-8 text-xs text-gray-400">Memuat catatan masukan...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">Belum ada catatan masukan dari atasan.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <span>{c.user?.name || `Pengguna #${c.user_id}`}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input Balasan Komentar */}
            <form onSubmit={handleSendComment} className="pt-2 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis balasan atau penjelasan untuk atasan..."
                className="flex-1 px-3.5 py-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSendingComment || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow disabled:opacity-50"
              >
                {isSendingComment ? '...' : 'Kirim'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Logbook (Revisi) */}
      {editModalOpen && selectedLogbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Perbarui Catatan Logbook</h3>
            <p className="text-xs text-gray-500">
              Perbaiki judul, deskripsi, atau durasi waktu kerja sesuai dengan masukan atasan.
            </p>

            <form onSubmit={handleUpdateLogbook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Judul Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Deskripsi / Rincian Pekerjaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Durasi Kerja (Menit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editFormData.duration_minutes}
                  onChange={(e) => setEditFormData({ ...editFormData, duration_minutes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
