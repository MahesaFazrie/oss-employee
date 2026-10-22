import apiClient from '../lib/axios';

// ─── Employee Dashboard Types ────────────────────────────────────────────────

export interface ActiveTimer {
  id: number;
  started_at: string;
  elapsed: number; // seconds elapsed since started_at (from backend)
}

export interface CurrentMonthSummary {
  month: number;
  year: number;
  total_duration_seconds: number;
  total_hours: number;
  logbook_count: number;
}

export interface LatestPayroll {
  id: number;
  period_month: number;
  period_year: number;
  status: string;
}

export interface EmployeeDashboardData {
  active_timer: ActiveTimer | null;
  current_month: CurrentMonthSummary;
  latest_payroll: LatestPayroll | null;
  logbooks_needing_revision: number;
}

// ─── Director Dashboard Types ────────────────────────────────────────────────

export interface MonthlyWorkHour {
  month: number;
  year: number;
  label: string;
  total_duration_seconds: number;
  total_hours: number;
}

export interface RecentPayroll {
  id: number;
  user: { id: number; name: string };
  period_month: number;
  period_year: number;
  status: string;
  created_at: string;
}

export interface DirectorDashboardData {
  logbooks_pending_review: number;
  payrolls_pending_approval: number;
  payrolls_pending_processing: number;
  total_active_employees: number;
  monthly_work_hours: MonthlyWorkHour[];
  recent_payrolls: RecentPayroll[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const dashboardService = {
  async getEmployeeDashboard(): Promise<{ success: boolean; data: EmployeeDashboardData; message: string }> {
    const response = await apiClient.get('/dashboard/employee');
    return response.data;
  },

  async getDirectorDashboard(): Promise<{ success: boolean; data: DirectorDashboardData; message: string }> {
    const response = await apiClient.get('/dashboard/director');
    return response.data;
  },
};
