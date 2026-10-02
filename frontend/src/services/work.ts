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
