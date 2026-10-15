import apiClient from '../lib/axios';

export interface SnapshotItem {
  id: number;
  logbook_id: number;
  title: string;
  description: string;
  date: string;
  duration_seconds: number;
  logbook_status: string;
}

export interface PayrollSubmission {
  id: number;
  user_id: number;
  period_month: number;
  period_year: number;
  status: string;
  submitted_at: string | null;
  total_duration_seconds: number | null;
  total_entries: number | null;
  created_at: string;
  updated_at: string;
  snapshot_items?: SnapshotItem[];
}

export interface PayrollPreview {
  period_month: number;
  period_year: number;
  summary: {
    total_duration_seconds: number;
    total_duration_formatted: string;
    total_entries: number;
  };
  entries: {
    id: number;
    date: string;
    title: string;
    description: string;
    duration_seconds: number;
    status: string;
  }[];
}

export const payrollService = {
  async getSubmissions(): Promise<{ success: boolean; data: PayrollSubmission[] }> {
    const response = await apiClient.get('/payroll');
    return response.data;
  },

  async getSubmissionDetail(id: number | string): Promise<{ success: boolean; data: PayrollSubmission }> {
    const response = await apiClient.get(`/payroll/${id}`);
    return response.data;
  },

  async getPreview(month: number, year: number): Promise<{ success: boolean; data: PayrollPreview }> {
    const response = await apiClient.get('/payroll/draft/preview', {
      params: { month, year }
    });
    return response.data;
  },

  async createDraft(month: number, year: number): Promise<{ success: boolean; data: PayrollSubmission }> {
    const response = await apiClient.post('/payroll/draft', {
      period_month: month,
      period_year: year
    });
    return response.data;
  },

  async submitPayroll(id: number | string): Promise<{ success: boolean; data: PayrollSubmission }> {
    const response = await apiClient.post(`/payroll/${id}/submit`);
    return response.data;
  },

  async resubmitPayroll(id: number | string): Promise<{ success: boolean; data: PayrollSubmission }> {
    const response = await apiClient.post(`/payroll/${id}/resubmit`);
    return response.data;
  },

  async getPayrollHistory(id: number | string): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get(`/payroll/${id}/history`);
    return response.data;
  }
};
