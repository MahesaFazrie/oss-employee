import apiClient from '../lib/axios';

export const adminService = {
  // Managemen Approval Akun
  async getUsers(params?: Record<string, any>) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },
  async approveUser(id: number, roleIds: number[], note: string = '') {
    const response = await apiClient.post(`/admin/users/${id}/approve`, { role_ids: roleIds, note });
    return response.data;
  },
  async rejectUser(id: number, note: string = '') {
    const response = await apiClient.post(`/admin/users/${id}/reject`, { note });
    return response.data;
  },

  // Managemen Role & Permissions
  async getRoles() {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },
  async getPermissions(module?: string) {
    const response = await apiClient.get('/admin/permissions', { params: { module } });
    return response.data;
  },
  async syncPermissions(roleId: number, permissionIds: number[]) {
    const response = await apiClient.post(`/admin/roles/${roleId}/permissions`, { permission_ids: permissionIds });
    return response.data;
  }
};
