import apiClient from '../lib/axios';

export const timerService = {
  async start() {
    const response = await apiClient.post('/timer/start');
    return response.data;
  },
  async stop(note: string) {
    const response = await apiClient.post('/timer/stop', { note });
    return response.data;
  },
  async getActive() {
    const response = await apiClient.get('/timer/active');
    return response.data;
  }
};

export const logbookService = {
  async getLogbooks(params?: Record<string, any>) {
    const response = await apiClient.get('/logbooks', { params });
    return response.data;
  },
  async storeLogbook(data: any) {
    const response = await apiClient.post('/logbooks', data);
    return response.data;
  }
};

export const recapService = {
  async getMonthlyRecap(month: number, year: number, userId?: number) {
    const params: any = { month, year };
    if (userId) params.user_id = userId;
    const response = await apiClient.get('/recap/monthly', { params });
    return response.data; // Ini mengembalikan JSON { success, data: { summary, entries }, message }
  },
  async exportExcel(month: number, year: number, userId?: number) {
    const params: any = { month, year };
    if (userId) params.user_id = userId;
    const response = await apiClient.get('/recap/monthly/export', { 
      params,
      responseType: 'blob' // Karena balasan berupa file Excel
    });
    return response;
  }
};
