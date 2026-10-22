import apiClient from '../lib/axios';

export interface AuditLogUser {
  id: number;
  name: string;
  email: string;
}

export interface AuditLogChanges {
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  [key: string]: any;
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  user: AuditLogUser | null;
  action: 'created' | 'updated' | 'deleted' | string;
  entity_type: string;
  entity_id: number;
  changes: AuditLogChanges | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogPagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  pagination: AuditLogPagination;
}

export interface AuditLogFilters {
  user_id?: number | string;
  action?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export const auditLogService = {
  /**
   * Mengambil daftar audit logs dengan filter opsional
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<{ success: boolean; data: AuditLogResponse; message: string }> {
    const response = await apiClient.get('/admin/audit-logs', { params: filters });
    return response.data;
  },
};
