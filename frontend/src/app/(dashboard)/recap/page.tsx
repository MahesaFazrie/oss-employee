"use client";

import { useState, useEffect } from 'react';
import { recapService } from '@/services/work';

export default function RecapPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [recapData, setRecapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await recapService.getMonthlyRecap(month, year);
      if (res.success) {
        setRecapData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data rekapitulasi.');
      setRecapData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, [month, year]);

  const handleExport = async () => {
    try {
      const res = await recapService.exportExcel(month, year);
      
      // Buat file Blob untuk di-download browser
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recap_${year}_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mengunduh file Excel.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Laporan & Rekapitulasi</h2>
          <p className="text-sm text-gray-500 mt-1">Ringkasan hasil kerja dan logbook Anda setiap bulannya.</p>
        </div>
        
        <div className="flex space-x-3 items-center">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
          >
            {[...Array(5)].map((_, i) => (
              <option key={currentDate.getFullYear() - i} value={currentDate.getFullYear() - i}>
                {currentDate.getFullYear() - i}
              </option>
            ))}
          </select>
          
          <button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-colors"
          >
            Download Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Memuat data rekapitulasi...</div>
      ) : recapData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <p className="text-sm font-medium text-blue-800 mb-1">Total Entri Logbook</p>
              <h3 className="text-3xl font-bold text-blue-900">{recapData.summary.total_entries} <span className="text-lg font-normal">tugas</span></h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
              <p className="text-sm font-medium text-indigo-800 mb-1">Total Waktu Kerja (Estimasi)</p>
              <h3 className="text-3xl font-bold text-indigo-900">{recapData.summary.total_duration_formatted}</h3>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pekerjaan</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recapData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      Tidak ada catatan kerja di bulan ini.
                    </td>
                  </tr>
                ) : (
                  recapData.entries.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">{log.title}</div>
                        <div className="text-gray-500 mt-1">{log.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {Math.floor(log.duration_seconds / 60)} Menit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'approved' ? 'bg-green-100 text-green-800' 
                          : log.status === 'rejected' ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
