import apiClient from '../lib/axios';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/register', data);
    return response.data;
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/reset-password', data);
    return response.data;
  }
};
