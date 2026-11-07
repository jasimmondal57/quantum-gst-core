<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Modules\GSTEngine\Services\EInvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EInvoiceController extends Controller
{
    protected EInvoiceService $eInvoiceService;

    public function __construct(EInvoiceService $eInvoiceService)
    {
        $this->eInvoiceService = $eInvoiceService;
    }

    /**
     * Tenant verification helper.
     */
    protected function authorizeInvoice(Request $request, Invoice $invoice): void
    {
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $allowed = DB::table('businesses')
                ->where('id', $invoice->business_id)
                ->whereIn('organization_id', $userOrgIds)
                ->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized: Invoice does not belong to your organization.');
            }
        }
    }

    /**
     * Generate statutory E-Invoice (IRN, Ack No, Signed QR Code).
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|uuid|exists:invoices,id',
        ]);

        $invoice = Invoice::with(['businessGstin', 'customer', 'items'])->findOrFail($validated['invoice_id']);
        $this->authorizeInvoice($request, $invoice);

        $updated = $this->eInvoiceService->generateEInvoice($invoice);

        return response()->json([
            'success' => true,
            'message' => 'e-Invoice IRN successfully registered.',
            'invoice_id' => $updated->id,
            'invoice_number' => $updated->invoice_number,
            'irn' => $updated->irn,
            'ack_no' => $updated->ack_no,
            'ack_date' => $updated->ack_date,
            'signed_qr_code' => $updated->signed_qr_code,
            'einvoice_status' => $updated->einvoice_status,
        ], 200);
    }

    /**
     * Download or inspect official GSTN e-Invoice Schema v1.1 JSON.
     */
    public function jsonSchema(Request $request, string $id)
    {
        $invoice = Invoice::with(['businessGstin', 'customer', 'items'])->findOrFail($id);
        $this->authorizeInvoice($request, $invoice);

        $payload = $this->eInvoiceService->generateSchemaV1Payload($invoice);

        return response()->json($payload);
    }

    /**
     * Cancel an IRN with statutory reason code.
     */
    public function cancel(Request $request, string $id)
    {
        $invoice = Invoice::findOrFail($id);
        $this->authorizeInvoice($request, $invoice);

        $validated = $request->validate([
            'reason_code' => 'required|string|in:1,2,3,4',
            'remarks' => 'nullable|string|max:100',
        ]);

        $cancelled = $this->eInvoiceService->cancelEInvoice(
            invoice: $invoice,
            reasonCode: $validated['reason_code'],
            remarks: $validated['remarks'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'e-Invoice IRN cancelled successfully.',
            'invoice_id' => $cancelled->id,
            'einvoice_status' => $cancelled->einvoice_status,
            'cancel_reason' => $cancelled->einvoice_cancel_reason,
        ]);
    }
}
