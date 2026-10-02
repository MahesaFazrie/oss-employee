"use client";

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch data roles dan permissions secara paralel
      const [rolesRes, permsRes] = await Promise.all([
        adminService.getRoles(),
        adminService.getPermissions()
      ]);
      setRoles(rolesRes?.data || []);
      setPermissions(permsRes?.data || []);
    } catch (err) {
      setError('Gagal memuat data Role dan Permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (roleId: number, permissionId: number, isChecked: boolean) => {
    // Optimistic UI update (update local state)
    // Asumsi properti permissions di object role berisi ID permission yang aktif
    const updatedRoles = roles.map((role) => {
      if (role.id === roleId) {
        let currentPerms = role.permissions || [];
        if (isChecked) {
          currentPerms = [...currentPerms, { id: permissionId }]; // Menambahkan relasi
        } else {
          currentPerms = currentPerms.filter((p: any) => p.id !== permissionId); // Menghapus relasi
        }
        return { ...role, permissions: currentPerms };
      }
      return role;
    });
    setRoles(updatedRoles);
  };

  const handleSave = async (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const permissionIds = (role.permissions || []).map((p: any) => p.id);

    try {
      await adminService.syncPermissions(roleId, permissionIds);
      alert(`Berhasil menyimpan permission untuk role: ${role.name}`);
    } catch (err) {
      alert(`Gagal menyimpan permission untuk role: ${role.name}`);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Manajemen Role & Permission</h2>
      <p className="text-sm text-gray-500 mb-6">
        Centang permission yang sesuai untuk masing-masing role, lalu klik "Simpan" di bawah kolom role tersebut.
      </p>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {isLoading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r w-64">
                  Nama Permission
                </th>
                {roles.map(role => (
                  <th key={role.id} className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {permissions.map(perm => (
                <tr key={perm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r font-medium">
                    {perm.code}
                    <div className="text-xs text-gray-400 font-normal">{perm.description}</div>
                  </td>
                  {roles.map(role => {
                    const hasPermission = (role.permissions || []).some((p: any) => p.id === perm.id);
                    return (
                      <td key={`${role.id}-${perm.id}`} className="px-6 py-4 whitespace-nowrap text-center border-r">
                        <input 
                          type="checkbox" 
                          checked={hasPermission}
                          onChange={(e) => handleCheckboxChange(role.id, perm.id, e.target.checked)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 border-r"></td>
                {roles.map(role => (
                  <td key={role.id} className="px-6 py-4 text-center border-r">
                    <button 
                      onClick={() => handleSave(role.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      Simpan
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
