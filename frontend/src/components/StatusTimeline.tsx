import React from 'react';

export interface StatusHistoryItem {
  id: number;
  from_status: string;
  to_status: string;
  notes?: string | null;
  changed_by?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
}

interface StatusTimelineProps {
  history: StatusHistoryItem[];
  title?: string;
  className?: string;
}

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
  icon: React.ReactNode;
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    ringColor: 'ring-gray-200',
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  submitted: {
    label: 'Diajukan',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-500',
    ringColor: 'ring-blue-200',
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  under_review: {
    label: 'Sedang Ditinjau',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-500',
    ringColor: 'ring-purple-200',
    icon: (
      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  revision_requested: {
    label: 'Perlu Revisi',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-500',
    ringColor: 'ring-amber-200',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  needs_revision: {
    label: 'Perlu Revisi',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-500',
    ringColor: 'ring-amber-200',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  approved: {
    label: 'Disetujui',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-500',
    ringColor: 'ring-green-200',
    icon: (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  rejected: {
    label: 'Ditolak',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-500',
    ringColor: 'ring-red-200',
    icon: (
      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  processed: {
    label: 'Telah Dibayar',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-500',
    ringColor: 'ring-emerald-200',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const getDefaultConfig = (status: string): StatusConfig => ({
  label: status,
  bgColor: 'bg-gray-100',
  textColor: 'text-gray-700',
  borderColor: 'border-gray-300',
  ringColor: 'ring-gray-200',
  icon: (
    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
});

export default function StatusTimeline({
  history,
  title = 'Riwayat Perubahan Status (Audit Trail)',
  className = '',
}: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className={`bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <div className="w-10 h-10 mx-auto mb-2 text-gray-400 flex items-center justify-center rounded-full bg-white shadow-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 font-medium">Belum ada riwayat perubahan status pada pengajuan ini.</p>
      </div>
    );
  }

  // Tampilkan urutan: entri terakhir berada di paling atas atau bawah?
  // Standar audit trail: urutan kronologis vertikal dari atas ke bawah (index 0 adalah awal, index terakhir adalah status terkini).
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {title}
          </h3>
          <span className="text-xs text-gray-500">
            {history.length} peristiwa tercatat
          </span>
        </div>
      )}

      <div className="relative pl-6 sm:pl-8">
        {/* Garis vertikal timeline */}
        <div className="absolute left-3.5 sm:left-4 top-3 bottom-3 w-0.5 bg-gray-200" aria-hidden="true" />

        <div className="space-y-6">
          {history.map((item, index) => {
            const isLatest = index === history.length - 1;
            const targetConfig = STATUS_CONFIGS[item.to_status] || getDefaultConfig(item.to_status);
            const sourceConfig = STATUS_CONFIGS[item.from_status] || getDefaultConfig(item.from_status);

            const isNegative = ['rejected', 'revision_requested', 'needs_revision'].includes(item.to_status);

            const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={item.id} className="relative flex items-start group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white border-2 ${targetConfig.borderColor} ${
                    isLatest ? `ring-4 ${targetConfig.ringColor} shadow-sm` : ''
                  }`}
                >
                  {targetConfig.icon}
                </div>

                {/* Konten Card */}
                <div className="flex-1 ml-4 sm:ml-5">
                  <div
                    className={`p-4 rounded-lg border transition-all ${
                      isLatest
                        ? 'bg-white border-gray-300 shadow-sm'
                        : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Header item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Status Pills */}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sourceConfig.bgColor} ${sourceConfig.textColor}`}>
                          {sourceConfig.label}
                        </span>
                        <span className="text-gray-400 text-xs font-bold">&rarr;</span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${targetConfig.bgColor} ${targetConfig.textColor}`}>
                          {targetConfig.label}
                        </span>

                        {isLatest && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Status Terkini
                          </span>
                        )}
                      </div>

                      {/* Waktu */}
                      <time className="text-xs text-gray-500 font-medium">
                        {formattedDate} WIB
                      </time>
                    </div>

                    {/* Aktor */}
                    <p className="text-xs text-gray-600 mb-1">
                      Diubah oleh:{' '}
                      <strong className="text-gray-900 font-semibold">
                        {item.changed_by?.name || 'Sistem'}
                      </strong>
                    </p>

                    {/* Catatan / Reviewer Note */}
                    {item.notes && (
                      <div
                        className={`mt-2.5 p-3 rounded-md text-xs leading-relaxed border ${
                          isNegative
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="font-semibold text-[11px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Catatan / Instruksi:
                        </div>
                        <p className="whitespace-pre-wrap italic">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
