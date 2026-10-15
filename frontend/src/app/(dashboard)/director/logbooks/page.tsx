"use client";

import { useState, useEffect } from 'react';
import { directorService, DirectorLogbook, LogbookComment } from '@/services/director';

export default function DirectorLogbookVerificationPage() {
  const [logbooks, setLogbooks] = useState<DirectorLogbook[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'revision_requested'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Minta Revisi
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedLogbookForRevision, setSelectedLogbookForRevision] = useState<DirectorLogbook | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // State untuk Modal Komentar / Diskusi
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedLogbookForComment, setSelectedLogbookForComment] = useState<DirectorLogbook | null>(null);
  const [comments, setComments] = useState<LogbookComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const fetchLogbooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await directorService.getReviewLogbooks(activeTab === 'all' ? undefined : activeTab);
      setLogbooks(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data logbook untuk verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogbooks();
  }, [activeTab]);

  const handleApprove = async (logbook: DirectorLogbook) => {
    if (!confirm(`Setujui catatan logbook "${logbook.title}" milik ${logbook.user.name}?`)) {
      return;
    }

    try {
      await directorService.approveLogbook(logbook.id);
      alert('Logbook berhasil disetujui!');
      fetchLogbooks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui logbook.');
    }
  };

  const openRevisionModal = (logbook: DirectorLogbook) => {
    setSelectedLogbookForRevision(logbook);
    setRevisionComment('');
    setRevisionModalOpen(true);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogbookForRevision || !revisionComment.trim()) return;

    setIsSubmittingRevision(true);
    try {
      await directorService.requestLogbookRevision(selectedLogbookForRevision.id, revisionComment.trim());
      alert('Permintaan revisi berhasil dikirim ke karyawan!');
      setRevisionModalOpen(false);
      fetchLogbooks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengirim permintaan revisi.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const openCommentModal = async (logbook: DirectorLogbook) => {
    setSelectedLogbookForComment(logbook);
    setCommentModalOpen(true);
    setNewComment('');
    setIsLoadingComments(true);
    try {
      const res = await directorService.getComments(logbook.id);
      setComments(res.data || []);
    } catch (err) {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogbookForComment || !newComment.trim()) return;

    setIsSendingComment(true);
    try {
      await directorService.addComment(selectedLogbookForComment.id, newComment.trim());
      setNewComment('');
      // Refresh list komentar
      const res = await directorService.getComments(selectedLogbookForComment.id);
      setComments(res.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengirim komentar.');
    } finally {
      setIsSendingComment(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'revision_requested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Perlu Revisi</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Menunggu Verifikasi</span>;
    }
  };

  const filteredLogbooks = logbooks.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Verifikasi & Review Logbook</h2>
          <p className="text-sm text-gray-500 mt-1">
            Panel Direktur untuk meninjau dan memverifikasi catatan pekerjaan harian seluruh karyawan.
          </p>
        </div>
        <button
          onClick={fetchLogbooks}
          className="px-3.5 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">{error}</div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pending', label: 'Menunggu Verifikasi' },
            { id: 'all', label: 'Semua Logbook' },
            { id: 'approved', label: 'Sudah Disetujui' },
            { id: 'revision_requested', label: 'Diminta Revisi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
            placeholder="Cari karyawan atau tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Memuat catatan logbook...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Karyawan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status Verifikasi</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi Keputusan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogbooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada catatan logbook yang ditemukan pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredLogbooks.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap text-gray-700 font-medium">
                      {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{log.user?.name || `User #${log.user?.id}`}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-800 max-w-md">
                      <div className="font-semibold text-gray-900">{log.title}</div>
                      {log.description && (
                        <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap line-clamp-2">{log.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                      {Math.floor(log.duration_seconds / 60)} menit
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {getVerificationBadge(log.verification_status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      {log.verification_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(log)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => openRevisionModal(log)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Minta Revisi
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openCommentModal(log)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 transition-colors"
                      >
                        Diskusi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Minta Revisi */}
      {revisionModalOpen && selectedLogbookForRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Minta Revisi Logbook</h3>
            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 text-xs text-gray-700 space-y-1">
              <p><strong>Karyawan:</strong> {selectedLogbookForRevision.user.name}</p>
              <p><strong>Tugas:</strong> {selectedLogbookForRevision.title}</p>
            </div>
            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Catatan Revisi / Masukan untuk Karyawan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Jelaskan apa yang perlu diperbaiki atau dilengkapi oleh karyawan..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision || !revisionComment.trim()}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-semibold shadow disabled:opacity-50"
                >
                  {isSubmittingRevision ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Diskusi / Komentar */}
      {commentModalOpen && selectedLogbookForComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Diskusi & Komentar</h3>
              <button
                onClick={() => setCommentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              Pekerjaan: <strong>{selectedLogbookForComment.title}</strong> ({selectedLogbookForComment.user.name})
            </div>

            {/* List Komentar */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px]">
              {isLoadingComments ? (
                <div className="text-center py-8 text-xs text-gray-400">Memuat komentar...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">Belum ada komentar untuk logbook ini.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <span>{c.user?.name || `User #${c.user_id}`}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input Komentar Baru */}
            <form onSubmit={handleSendComment} className="pt-2 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis balasan atau catatan..."
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
    </div>
  );
}
