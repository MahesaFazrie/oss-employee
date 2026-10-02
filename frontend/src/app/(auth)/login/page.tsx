"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data?.token) {
        // Simpan token untuk interceptor axios
        localStorage.setItem('token', response.data.token);
        
        // Asumsi login berhasil, navigasi ke halaman dashboard
        router.push('/'); 
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 403) {
        setError('Akses ditolak: Akun Anda mungkin masih pending atau diblokir.');
      } else if (status === 401) {
        setError('Email atau password yang Anda masukkan salah.');
      } else if (status === 429) {
        setError('Terlalu banyak percobaan. Silakan coba lagi nanti.');
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan sistem. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        ONE STOP SERVICE
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Administrasi Internal dalam Satu Sistem
      </p>
      
      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1">
              <input 
                id="email" 
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1">
              <input 
                id="password" 
                name="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : 'MASUK'}
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Lupa password?
          </Link>
          <Link href="/register" className="font-medium text-gray-900 hover:text-blue-600">
            Belum punya akun? Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
