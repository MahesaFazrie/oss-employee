"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notificationService, NotificationItem } from '@/services/notification';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function getNotificationIcon(item: NotificationItem): { icon: string; bg: string } {
  const { data } = item;
  if (data.entity_type === 'logbook') {
    if (data.action === 'approved') return { icon: '✅', bg: 'bg-green-100 text-green-700' };
    if (data.action === 'revision_requested') return { icon: '⚠️', bg: 'bg-amber-100 text-amber-700' };
    return { icon: '📝', bg: 'bg-blue-100 text-blue-700' };
  }
  if (data.entity_type === 'payroll') {
    if (data.status === 'approved') return { icon: '✅', bg: 'bg-green-100 text-green-700' };
    if (data.status === 'processed') return { icon: '💰', bg: 'bg-emerald-100 text-emerald-700' };
    if (data.status === 'revision_requested') return { icon: '⚠️', bg: 'bg-amber-100 text-amber-700' };
    if (data.status === 'rejected') return { icon: '❌', bg: 'bg-red-100 text-red-700' };
    if (data.status === 'submitted') return { icon: '📤', bg: 'bg-blue-100 text-blue-700' };
    return { icon: '💳', bg: 'bg-purple-100 text-purple-700' };
  }
  return { icon: '🔔', bg: 'bg-gray-100 text-gray-700' };
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications(1);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // Silently ignore network/auth errors in polling
    }
  }, []);

  // Fetch saat mount & pasang interval polling tiap 60 detik
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

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

    setIsOpen(false);

    // Navigasi ke halaman target
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notifikasi"
        aria-label="Pusat Notifikasi"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? 'Menandai...' : 'Tandai semua dibaca'}
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">🔕</div>
                <p className="text-xs font-semibold text-gray-600">Tidak ada notifikasi</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Semua info terbaru akan muncul di sini</p>
              </div>
            ) : (
              items.slice(0, 8).map((item) => {
                const { icon, bg } = getNotificationIcon(item);
                const isUnread = !item.read_at;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      isUnread ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-blue-600" />
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${bg}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'} line-clamp-1`}>
                        {item.data.title}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.data.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
            >
              Lihat Semua Notifikasi →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
