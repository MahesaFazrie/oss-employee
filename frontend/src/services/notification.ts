import apiClient from '../lib/axios';

export interface NotificationData {
  title: string;
  message: string;
  entity_type: 'logbook' | 'payroll' | string;
  entity_id: number;
  action?: string;
  status?: string;
  comment?: string | null;
  notes?: string | null;
}

export interface NotificationItem {
  id: string; // UUID
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPagination {
  current_page: number;
  last_page: number;
  total: number;
}

export interface NotificationResponse {
  items: NotificationItem[];
  unread_count: number;
  pagination: NotificationPagination;
}

export const notificationService = {
  /**
   * Mengambil daftar notifikasi pengguna
   */
  async getNotifications(page: number = 1): Promise<{ success: boolean; data: NotificationResponse; message: string }> {
    const response = await apiClient.get('/notifications', { params: { page } });
    return response.data;
  },

  /**
   * Menandai 1 notifikasi spesifik sebagai sudah dibaca
   */
  async markAsRead(id: string): Promise<{ success: boolean; data: null; message: string }> {
    const response = await apiClient.post(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Menandai semua notifikasi pengguna sebagai sudah dibaca
   */
  async markAllAsRead(): Promise<{ success: boolean; data: null; message: string }> {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },
};
