"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notificationService, NotificationItem, NotificationPagination } from '@/services/notification';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getNotificationBadge(item: NotificationItem): { icon: string; bg: string; border: string; text: string } {
  const { data } = item;
  if (data.entity_type === 'logbook') {
    if (data.action === 'approved') return { icon: '✅', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
    if (data.action === 'revision_requested') return { icon: '⚠️', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
    return { icon: '📝', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
  }
  if (data.entity_type === 'payroll') {
    if (data.status === 'approved') return { icon: '✅', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
    if (data.status === 'processed') return { icon: '💰', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' };
    if (data.status === 'revision_requested') return { icon: '⚠️', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
    if (data.status === 'rejected') return { icon: '❌', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
    if (data.status === 'submitted') return { icon: '📤', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
    return { icon: '💳', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' };
  }
  return { icon: '🔔', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pagination, setPagination] = useState<NotificationPagination | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'logbook' | 'payroll'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications(page);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unread_count || 0);
        setPagination(res.data.pagination);
      }
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage, fetchNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.read_at) {
      try {
        await notificationService.markAsRead(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }

    // Direct to relevant page
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let isDirector = false;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        isDirector = u.role?.name === 'direktur' || u.role?.permissions?.some((p: any) => p.name === 'approve-payroll');
      } catch {}
    }

    if (item.data.entity_type === 'payroll' && item.data.entity_id) {
      if (isDirector) {
        router.push(`/director/payrolls/${item.data.entity_id}`);
      } else {
        router.push(`/payroll/${item.data.entity_id}`);
      }
    } else if (item.data.entity_type === 'logbook') {
      if (isDirector) {
        router.push('/director/logbooks');
      } else {
        router.push('/logbook');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {} finally {
      setIsMarkingAll(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeTab === 'unread') return !item.read_at;
    if (activeTab === 'logbook') return item.data.entity_type === 'logbook';
    if (activeTab === 'payroll') return item.data.entity_type === 'payroll';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Pusat Notifikasi</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Informasi status verifikasi logbook, persetujuan payroll, dan pembaruan sistem Anda
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isMarkingAll ? 'Menandai...' : 'Tandai Semua Dibaca'}
            </button>
          )}
          <button
            onClick={() => fetchNotifications(currentPage)}
            className="px-3.5 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Semua ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          Belum Dibaca ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          💳 Payroll
        </button>
        <button
          onClick={() => setActiveTab('logbook')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'logbook'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          📝 Logbook
        </button>
      </div>

      {/* List Container */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-base font-bold text-gray-800">Tidak ada notifikasi</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'unread'
              ? 'Bagus sekali! Semua notifikasi Anda sudah dibaca.'
              : 'Belum ada notifikasi pada kategori yang Anda pilih.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const badge = getNotificationBadge(item);
            const isUnread = !item.read_at;

            return (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item)}
                className={`bg-white rounded-xl border p-5 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border ${badge.bg} ${badge.border}`}
                  >
                    {badge.icon}
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {item.data.title}
                      </h4>
                      {isUnread && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          BARU
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.data.message}
                    </p>

                    {(item.data.comment || item.data.notes) && (
                      <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 italic">
                        &quot;{item.data.comment || item.data.notes}&quot;
                      </div>
                    )}

                    <p className="text-[11px] text-gray-400 mt-2">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                    Buka Detail →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs">
          <p className="text-gray-500">
            Halaman <span className="font-semibold text-gray-800">{pagination.current_page}</span> dari{' '}
            <span className="font-semibold text-gray-800">{pagination.last_page}</span> ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1}
              className="px-3.5 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page >= pagination.last_page}
              className="px-3.5 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
