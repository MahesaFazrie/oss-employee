"use client";

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin';

export default function ApprovalPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers({ status: 'pending' });
      // Di Laravel dengan ->get(), datanya langsung di response.data
      setUsers(response?.data || []);
    } catch (err: any) {
      setError('Gagal mengambil data akun pending. Pastikan backend sudah menyala.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      // Default menyematkan role "employee" (ID 3, akan disesuaikan saat final)
      await adminService.approveUser(id, 3, 'Approved via Dashboard UI'); 
      alert('Akun berhasil disetujui!');
      fetchPendingUsers(); // Refresh tabel
    } catch (error) {
      alert('Gagal menyetujui akun.');
    }
  };

  const handleReject = async (id: number) => {
    const note = prompt("Masukkan alasan penolakan:");
    if (note === null) return; // User membatalkan

    try {
      await adminService.rejectUser(id, note); 
      alert('Akun berhasil ditolak!');
      fetchPendingUsers(); // Refresh tabel
    } catch (error) {
      alert('Gagal menolak akun.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Daftar Akun Menunggu Persetujuan</h2>
        <button onClick={fetchPendingUsers} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
          Refresh
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {isLoading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Aksi Keputusan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 font-medium">
                    Hore! Tidak ada akun yang menunggu persetujuan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleApprove(user.id)} 
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded mr-2 transition-colors"
                      >
                        Setujui
                      </button>
                      <button 
                        onClick={() => handleReject(user.id)}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors"
                      >
                        Tolak
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
