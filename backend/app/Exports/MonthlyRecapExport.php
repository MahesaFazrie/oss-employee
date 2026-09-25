<?php

namespace App\Exports;

use App\Models\Logbook;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MonthlyRecapExport implements FromCollection, WithHeadings, WithMapping
{
    private int $userId;
    private int $month;
    private int $year;
    private int $rowNumber = 0;

    public function __construct(int $userId, int $month, int $year)
    {
        $this->userId = $userId;
        $this->month = $month;
        $this->year = $year;
    }

    public function collection()
    {
        return Logbook::forUser($this->userId)
            ->forMonth($this->month, $this->year)
            ->orderBy('date')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Judul',
            'Deskripsi',
            'Durasi',
            'Status',
        ];
    }

    /**
     * @param Logbook $logbook
     */
    public function map($logbook): array
    {
        $this->rowNumber++;

        $hours = floor($logbook->duration_seconds / 3600);
        $minutes = floor(($logbook->duration_seconds % 3600) / 60);

        return [
            $this->rowNumber,
            $logbook->date->format('Y-m-d'),
            $logbook->title,
            $logbook->description ?? '-',
            sprintf('%02d:%02d', $hours, $minutes),
            $logbook->status,
        ];
    }
}
