"use client";

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        // Sesuai BRD: Response sebaiknya tidak membocorkan apakah email terdaftar (security mechanism).
        setMessage(response.message || 'Jika email terdaftar, instruksi reset akan dikirim.');
        setEmail('');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Terlalu banyak permintaan. Silakan coba lagi nanti.');
      } else {
        // Fallback message meskipun backend seharusnya mengembalikan pesan abstrak
        setError(err.response?.data?.message || 'Gagal mengirim instruksi reset. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Lupa Password
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Masukkan email terdaftar Anda untuk menerima tautan reset password
      </p>
      
      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">{message}</p>
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
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Kembali ke halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
