import apiClient from '../lib/axios';

export interface DirectorLogbook {
  id: number;
  user: {
    id: number;
    name: string;
  };
  title: string;
  description: string;
  date: string;
  duration_seconds: number;
  status: string;
  verification_status: 'pending' | 'approved' | 'revision_requested';
  created_at: string;
}

export interface LogbookComment {
  id: number;
  logbook_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  comment: string;
  created_at: string;
}

export interface PaymentProofInfo {
  id: number;
  original_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface DirectorPayroll {
  id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  period_month: number;
  period_year: number;
  status: string;
  submitted_at: string | null;
  total_duration_seconds: number | null;
  total_entries: number | null;
  created_at: string;
  updated_at: string;
  snapshot_items?: {
    id: number;
    logbook_id: number;
    title: string;
    description: string;
    date: string;
    duration_seconds: number;
    logbook_status: string;
  }[];
  status_history?: {
    id: number;
    from_status: string;
    to_status: string;
    notes: string | null;
    changed_by: {
      id: number;
      name: string;
    } | null;
    created_at: string;
  }[];
}

export const directorService = {
  // ─── Logbook Verification ──────────────────────────
  async getReviewLogbooks(status?: string): Promise<{ success: boolean; data: DirectorLogbook[] }> {
    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await apiClient.get('/director/logbooks', { params });
    return response.data;
  },

  async approveLogbook(id: number, notes?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/logbooks/${id}/approve`, { notes });
    return response.data;
  },

  async requestLogbookRevision(id: number, comment: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/logbooks/${id}/request-revision`, { comment });
    return response.data;
  },

  // ─── Logbook Comments ─────────────────────────────
  async getComments(logbookId: number): Promise<{ success: boolean; data: LogbookComment[] }> {
    const response = await apiClient.get(`/logbooks/${logbookId}/comments`);
    return response.data;
  },

  async addComment(logbookId: number, comment: string): Promise<{ success: boolean; data: LogbookComment }> {
    const response = await apiClient.post(`/logbooks/${logbookId}/comments`, { comment });
    return response.data;
  },

  // ─── Payroll Approval ─────────────────────────────
  async getPayrolls(status?: string): Promise<{ success: boolean; data: DirectorPayroll[] }> {
    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await apiClient.get('/director/payrolls', { params });
    return response.data;
  },

  async getPayrollDetail(id: number | string): Promise<{ success: boolean; data: DirectorPayroll }> {
    const response = await apiClient.get(`/director/payrolls/${id}`);
    return response.data;
  },

  async approvePayroll(id: number | string, notes?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/payrolls/${id}/approve`, { notes });
    return response.data;
  },

  async rejectPayroll(id: number | string, notes: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/payrolls/${id}/reject`, { notes });
    return response.data;
  },

  async requestPayrollRevision(id: number | string, notes: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/payrolls/${id}/request-revision`, { notes });
    return response.data;
  },

  async markPayrollProcessed(id: number | string, notes?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/director/payrolls/${id}/mark-processed`, { notes });
    return response.data;
  },

  // ─── Payment Processing (OSS-501 & OSS-503) ───────
  async uploadPaymentProof(
    id: number | string,
    file: File
  ): Promise<{ success: boolean; data: PaymentProofInfo; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/director/payrolls/${id}/payment-proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async downloadPaymentProof(id: number | string): Promise<Blob> {
    const response = await apiClient.get(`/director/payrolls/${id}/payment-proof`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
