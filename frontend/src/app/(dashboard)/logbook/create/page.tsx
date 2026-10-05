"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logbookService } from '@/services/work';
import Link from 'next/link';

export default function CreateLogbookPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    document_link: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Menyesuaikan dengan schema backend Hafizh
      const payload = {
        title: formData.title,
        description: formData.description + (formData.document_link ? `\n\nLink Pendukung: ${formData.document_link}` : ''),
        date: formData.date,
        duration_seconds: parseInt(formData.duration_minutes) * 60 || 3600 // Konversi menit ke detik
      };

      await logbookService.storeLogbook(payload);
      alert('Logbook berhasil disimpan!');
      router.push('/logbook');
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('Validasi gagal. Pastikan seluruh kolom wajib sudah diisi.');
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan logbook.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-8 border border-gray-100 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Tulis Catatan Logbook Baru</h2>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Pekerjaan</label>
            <input 
              type="date"
              required 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi (Menit)</label>
            <input 
              type="number"
              required 
              min="1"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="Contoh: 120"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Pekerjaan</label>
          <input 
            type="text"
            required 
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Contoh: Mengembangkan fitur login frontend"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi / Hasil</label>
          <textarea 
            required 
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Rincian hasil pekerjaan..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Link Bukti Pendukung (Opsional)</label>
          <input 
            type="url"
            value={formData.document_link}
            onChange={(e) => setFormData({ ...formData, document_link: e.target.value })}
            placeholder="https://docs.google.com/..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Link href="/logbook" className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
            Batal
          </Link>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors">
            {isLoading ? 'Menyimpan...' : 'Simpan Logbook'}
          </button>
        </div>
      </form>
    </div>
  );
}
