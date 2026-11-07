<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessGstin;
use App\Models\CreditDebitNote;
use App\Models\Invoice;
use App\Models\InvoiceSequence;
use App\Services\AccountingEngineService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditDebitNoteController extends Controller
{
    protected AccountingEngineService $accountingService;

    public function __construct(AccountingEngineService $accountingService)
    {
        $this->accountingService = $accountingService;
    }
    /**
     * Statutory GSTN Reason Codes for Credit/Debit Notes.
     */
    public const REASON_CODES = [
        '01' => 'Sales Return',
        '02' => 'Post Sale Discount',
        '03' => 'Deficiency in Services',
        '04' => 'Correction in Invoice',
        '05' => 'Change in Place of Supply',
        '06' => 'Finalization of Provisional Assessment',
        '07' => 'Others',
    ];

    /**
     * List credit and debit notes for the authenticated tenant.
     */
    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = CreditDebitNote::with(['originalInvoice.customer', 'businessGstin']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereHas('business', function ($bq) use ($userOrgIds) {
                $bq->whereIn('organization_id', $userOrgIds);
            });
        }

        if ($request->filled('business_id')) {
            $query->where('business_id', $request->query('business_id'));
        }

        if ($request->filled('note_type')) {
            $query->where('note_type', $request->query('note_type'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('note_number', 'ilike', "%{$search}%")
                  ->orWhereHas('originalInvoice', function ($iq) use ($search) {
                      $iq->where('invoice_number', 'ilike', "%{$search}%");
                  });
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    /**
     * Store a statutory Credit or Debit Note with validation and sequential numbering.
     */
    public function store(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'original_invoice_id' => 'required|uuid|exists:invoices,id',
            'note_type' => 'required|string|in:credit_note,debit_note',
            'note_date' => 'required|date',
            'reason_code' => 'required|string|in:01,02,03,04,05,06,07',
            'taxable_value' => 'required|numeric|min:0.01',
            'cgst_amount' => 'nullable|numeric|min:0',
            'sgst_amount' => 'nullable|numeric|min:0',
            'igst_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        // Multi-Tenant Isolation: Ensure user has access to the business's organization
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $biz = DB::table('businesses')
                ->where('id', $validated['business_id'])
                ->whereIn('organization_id', $userOrgIds)
                ->first();

            if (!$biz) {
                return response()->json(['message' => 'Unauthorized: Business does not belong to your organization.'], 403);
            }
        }

        // Verify original invoice belongs to this business
        $originalInvoice = Invoice::where('business_id', $validated['business_id'])
            ->with('businessGstin')
            ->findOrFail($validated['original_invoice_id']);

        $businessGstinId = $originalInvoice->business_gstin_id;

        return DB::transaction(function () use ($validated, $originalInvoice, $businessGstinId) {
            // Sequential note numbering
            $noteDate = Carbon::parse($validated['note_date']);
            $fyStart = $noteDate->month >= 4 ? $noteDate->year : $noteDate->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $docType = $validated['note_type'] === 'credit_note' ? 'credit_note' : 'debit_note';
            $defaultPrefix = $validated['note_type'] === 'credit_note' ? 'CRN/' : 'DRN/';

            $sequence = InvoiceSequence::firstOrCreate(
                [
                    'business_id' => $validated['business_id'],
                    'business_gstin_id' => $businessGstinId,
                    'document_type' => $docType,
                    'financial_year' => $fyString,
                ],
                [
                    'prefix' => $defaultPrefix,
                    'next_number' => 1,
                ]
            );

            $noteNumber = $sequence->prefix . $fyString . '/' . str_pad((string) $sequence->next_number, 4, '0', STR_PAD_LEFT);
            $sequence->increment('next_number');

            $taxable = bcdiv((string) $validated['taxable_value'], '1', 2);
            $cgst = bcdiv((string) ($validated['cgst_amount'] ?? '0'), '1', 2);
            $sgst = bcdiv((string) ($validated['sgst_amount'] ?? '0'), '1', 2);
            $igst = bcdiv((string) ($validated['igst_amount'] ?? '0'), '1', 2);

            $totalTax = bcadd(bcadd($cgst, $sgst, 2), $igst, 2);
            $totalAmount = bcadd($taxable, $totalTax, 2);

            $reasonText = self::REASON_CODES[$validated['reason_code']] ?? 'General Adjustment';

            $note = CreditDebitNote::create([
                'business_id' => $validated['business_id'],
                'business_gstin_id' => $businessGstinId,
                'original_invoice_id' => $originalInvoice->id,
                'note_type' => $validated['note_type'],
                'note_number' => $noteNumber,
                'note_date' => $validated['note_date'],
                'reason' => "{$validated['reason_code']} - {$reasonText}",
                'taxable_value' => $taxable,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'igst_amount' => $igst,
                'total_amount' => $totalAmount,
                'status' => 'finalized',
            ]);

            // Automatically post double-entry ledger reversal records
            if ($note->note_type === 'credit_note') {
                $this->accountingService->postCreditNote($note);
            }

            return response()->json($note->load(['originalInvoice.customer', 'businessGstin']), 201);
        });
    }

    /**
     * Show note details scoped to authorized tenant.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = CreditDebitNote::with(['originalInvoice.customer', 'businessGstin', 'business']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereHas('business', function ($bq) use ($userOrgIds) {
                $bq->whereIn('organization_id', $userOrgIds);
            });
        }

        $note = $query->findOrFail($id);
        return response()->json($note);
    }

    /**
     * Download statutory Credit/Debit Note PDF.
     */
    public function downloadPdf(Request $request, string $id)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $query = CreditDebitNote::with(['originalInvoice.customer', 'businessGstin', 'business']);

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereHas('business', function ($bq) use ($userOrgIds) {
                $bq->whereIn('organization_id', $userOrgIds);
            });
        }

        $note = $query->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.credit_debit_note', compact('note'))
            ->setPaper('a4', 'portrait');

        $cleanNumber = str_replace(['/', '\\'], '-', $note->note_number);
        return $pdf->download("Note_{$cleanNumber}.pdf");
    }
}
