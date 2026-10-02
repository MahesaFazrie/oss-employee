"use client";
import { useState, useEffect } from 'react';
import { logbookService } from '@/services/work';
import Link from 'next/link';

export default function LogbookPage() {
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const fetchLogbooks = async () => {
    try {
      const res = await logbookService.getLogbooks();
      setLogbooks(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Catatan Logbook Anda</h2>
          <p className="text-sm text-gray-500">Daftar pekerjaan yang telah Anda laporkan.</p>
        </div>
        <Link 
          href="/logbook/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm font-medium transition-colors"
        >
          + Tambah Logbook
        </Link>
      </div>

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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Aktivitas</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Output</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logbooks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 font-medium">
                    Anda belum memiliki catatan logbook.
                  </td>
                </tr>
              ) : logbooks.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.activity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.output}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'approved' ? 'bg-green-100 text-green-800' : log.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {log.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
