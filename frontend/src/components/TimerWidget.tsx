"use client";

import { useState, useEffect } from 'react';
import { timerService } from '@/services/work';

export default function TimerWidget() {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0); // dalam detik
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveTimer();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsed(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const fetchActiveTimer = async () => {
    try {
      const res = await timerService.getActive();
      if (res.data) {
        setIsActive(true);
        // Backend mengembalikan timestamp ISO
        setStartTime(new Date(res.data.started_at));
      }
    } catch (err) {
      // Jika 404 (tidak ada timer aktif), abaikan saja
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await timerService.start();
      setIsActive(true);
      setStartTime(new Date(res.data.started_at));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memulai timer kerja.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    const note = prompt('Pekerjaan Anda selesai! Masukkan ringkasan singkat (opsional):');
    if (note === null) return; // User menekan cancel

    setIsLoading(true);
    try {
      await timerService.stop(note);
      setIsActive(false);
      setStartTime(null);
      setElapsed(0);
      alert('Sesi kerja diakhiri. Jangan lupa mengisi rincian di Logbook Anda!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengakhiri timer.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading && !isActive) {
    return <div className="text-sm text-gray-400 animate-pulse">Menghubungkan timer...</div>;
  }

  return (
    <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        {isActive && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        <div className={`text-lg font-mono font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
          {formatTime(elapsed)}
        </div>
      </div>
      
      {!isActive ? (
        <button 
          onClick={handleStart} 
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Mulai Kerja
        </button>
      ) : (
        <button 
          onClick={handleStop}
          disabled={isLoading} 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Berhenti
        </button>
      )}
    </div>
  );
}
