"use client";

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    password: '',
    password_confirmation: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (formData.password !== formData.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(formData);
      if (response.success) {
        setMessage(response.message || 'Password berhasil diubah. Anda sudah bisa Login.');
        setFormData({ email: '', token: '', password: '', password_confirmation: '' });
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
          const firstErrorKey = Object.keys(validationErrors)[0];
          setError(validationErrors[firstErrorKey][0]);
        } else {
          setError('Validasi gagal. Pastikan token benar dan password valid.');
        }
      } else {
        setError(err.response?.data?.message || 'Token tidak valid atau sudah kadaluarsa.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Set Password Baru
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Masukkan email, token reset, dan password baru Anda
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
                id="email" name="email" type="email" required 
                value={formData.email} onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">Token Reset</label>
            <div className="mt-1">
              <input 
                id="token" name="token" type="text" required 
                value={formData.token} onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password Baru</label>
            <div className="mt-1">
              <input 
                id="password" name="password" type="password" required 
                value={formData.password} onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
            <div className="mt-1">
              <input 
                id="password_confirmation" name="password_confirmation" type="password" required 
                value={formData.password_confirmation} onChange={handleChange}
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
              {isLoading ? 'Memproses...' : 'Simpan Password Baru'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Batal dan kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
