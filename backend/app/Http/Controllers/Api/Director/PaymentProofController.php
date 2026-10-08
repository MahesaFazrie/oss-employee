<?php

namespace App\Http\Controllers\Api\Director;

use App\Http\Controllers\Controller;
use App\Models\PaymentProof;
use App\Models\PayrollSubmission;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentProofController extends Controller
{
    use ApiResponseTrait;

    /**
     * OSS-501: Upload payment proof for a payroll submission.
     *
     * POST /api/director/payrolls/{id}/payment-proof
     */
    public function upload(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // 5MB max
        ]);

        $submission = PayrollSubmission::find($id);

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        // Only approved or processed payrolls can have payment proof
        if (! in_array($submission->status, ['approved', 'processed'])) {
            return $this->errorResponse(
                message: 'Bukti pembayaran hanya bisa diupload untuk payroll yang sudah diapprove.',
                code: 409
            );
        }

        $file = $request->file('file');

        // Store in private disk: storage/app/private/payment-proofs/
        $path = $file->store('payment-proofs', 'local');

        // Delete old proof if exists (replace)
        $existingProof = $submission->paymentProof;
        if ($existingProof) {
            Storage::disk('local')->delete($existingProof->file_path);
            $existingProof->delete();
        }

        $proof = PaymentProof::create([
            'payroll_submission_id' => $submission->id,
            'file_path'             => $path,
            'original_name'         => $file->getClientOriginalName(),
            'mime_type'             => $file->getMimeType(),
            'file_size'             => $file->getSize(),
            'uploaded_by'           => $request->user()->id,
        ]);

        return $this->successResponse(
            data: [
                'id'            => $proof->id,
                'original_name' => $proof->original_name,
                'mime_type'     => $proof->mime_type,
                'file_size'     => $proof->file_size,
                'uploaded_at'   => $proof->created_at->toIso8601String(),
            ],
            message: 'Bukti pembayaran berhasil diupload.',
            code: 201
        );
    }

    /**
     * OSS-501: Download/stream payment proof.
     *
     * GET /api/director/payrolls/{id}/payment-proof
     * Also accessible by payroll owner (karyawan).
     */
    public function download(Request $request, int $id): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        $submission = PayrollSubmission::with('paymentProof')->find($id);

        if (! $submission) {
            return $this->errorResponse(message: 'Payroll submission tidak ditemukan.', code: 404);
        }

        // Authorization: payroll owner OR Direktur/Superadmin
        $isOwner = $submission->user_id === $user->id;
        $isDirector = $user->hasPermission('approve-payroll') || $user->hasRole('superadmin');

        if (! $isOwner && ! $isDirector) {
            return $this->errorResponse(message: 'Anda tidak memiliki akses.', code: 403);
        }

        $proof = $submission->paymentProof;

        if (! $proof) {
            return $this->errorResponse(message: 'Bukti pembayaran belum diupload.', code: 404);
        }

        if (! Storage::disk('local')->exists($proof->file_path)) {
            return $this->errorResponse(message: 'File bukti pembayaran tidak ditemukan.', code: 404);
        }

        return Storage::disk('local')->download(
            $proof->file_path,
            $proof->original_name,
            ['Content-Type' => $proof->mime_type]
        );
    }
}
