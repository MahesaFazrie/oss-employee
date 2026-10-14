"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logbookService } from '@/services/work';
import Link from 'next/link';

export default function CreateLogbookPage() {
  const router = useRouter();

  // Data dari timer yang baru saja distop (integrasi otomatis)
  const [timerData, setTimerData] = useState<{
    id: number;
    duration_seconds: number;
    started_at: string;
    stopped_at: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_link: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '', // Hanya dipakai jika input manual (tidak ada timer)
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saat halaman dibuka, cek apakah ada data timer yang baru distop
  useEffect(() => {
    const raw = sessionStorage.getItem('last_stopped_timer');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setTimerData(parsed);
        // Otomatis isi tanggal dari stopped_at timer
        if (parsed.stopped_at) {
          setFormData(prev => ({
            ...prev,
            date: parsed.stopped_at.split('T')[0],
          }));
        }
      } catch {
        // Data rusak, abaikan
        sessionStorage.removeItem('last_stopped_timer');
      }
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} jam ${m} menit ${s} detik`;
    if (m > 0) return `${m} menit ${s} detik`;
    return `${s} detik`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let payload: any = {
        title: formData.title,
        description: formData.description + (formData.document_link ? `\n\nLink Pendukung: ${formData.document_link}` : ''),
        date: formData.date,
      };

      if (timerData) {
        // Jalur utama: gunakan work_timer_id dari timer yang baru saja distop
        payload.work_timer_id = timerData.id;
      } else {
        // Jalur fallback: input durasi manual
        const durationSecs = parseInt(formData.duration_minutes) * 60;
        if (!durationSecs || durationSecs < 60) {
          setError('Durasi minimal adalah 1 menit.');
          setIsLoading(false);
          return;
        }
        payload.duration_seconds = durationSecs;
      }

      await logbookService.storeLogbook(payload);

      // Hapus data timer dari sessionStorage setelah berhasil disimpan
      sessionStorage.removeItem('last_stopped_timer');

      alert('Logbook berhasil disimpan!');
      router.push('/logbook');
    } catch (err: any) {
      if (err.response?.status === 422) {
        const messages = err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Pastikan seluruh kolom wajib sudah diisi.';
        setError(`Validasi gagal: ${messages}`);
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan logbook.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-8 border border-gray-100 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Tulis Catatan Logbook Baru</h2>
      <p className="text-sm text-gray-500 mb-6">
        {timerData ? 'Melanjutkan dari sesi kerja yang baru saja selesai.' : 'Mengisi logbook secara manual.'}
      </p>

      {/* Banner info jika ada timer terintegrasi */}
      {timerData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Durasi otomatis terdeteksi dari Timer</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Total waktu kerja: <span className="font-bold">{formatDuration(timerData.duration_seconds)}</span>
            </p>
            <button
              type="button"
              onClick={() => setTimerData(null)}
              className="text-xs text-blue-500 underline mt-1 hover:text-blue-700"
            >
              Input durasi manual sebagai gantinya
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`grid gap-4 ${timerData ? 'grid-cols-1' : 'grid-cols-2'}`}>
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

          {/* Input durasi manual hanya muncul jika tidak ada data timer */}
          {!timerData && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Durasi Kerja (Menit) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required={!timerData}
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="Contoh: 120"
                className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Gunakan fitur Timer di header untuk otomatisasi</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Judul Pekerjaan <span className="text-red-500">*</span>
          </label>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Deskripsi / Hasil Pekerjaan <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Rincian pencapaian dan hasil pekerjaan Anda hari ini..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Link Bukti Pendukung <span className="text-gray-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="url"
            value={formData.document_link}
            onChange={(e) => setFormData({ ...formData, document_link: e.target.value })}
            placeholder="https://docs.google.com/..."
            className="block w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Link
            href="/logbook"
            className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Logbook'}
          </button>
        </div>
      </form>
    </div>
  );
}
