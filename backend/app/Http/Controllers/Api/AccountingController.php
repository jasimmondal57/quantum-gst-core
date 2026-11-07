<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\InvoiceSequence;
use App\Models\JournalEntry;
use App\Models\PaymentVoucher;
use App\Services\AccountingEngineService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    protected AccountingEngineService $accountingService;

    public function __construct(AccountingEngineService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Helper to verify tenant authorization.
     */
    protected function authorizeBusiness(Request $request, string $businessId): void
    {
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $allowed = DB::table('businesses')
                ->where('id', $businessId)
                ->whereIn('organization_id', $userOrgIds)
                ->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized: Business does not belong to your organization.');
            }
        }
    }

    /**
     * List Chart of Accounts (COA) for a business.
     */
    public function accounts(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'type' => 'nullable|string|in:asset,liability,equity,revenue,expense',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);
        $this->accountingService->ensureStandardChartOfAccounts($validated['business_id']);

        $query = Account::where('business_id', $validated['business_id'])->orderBy('code');
        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        return response()->json($query->get());
    }

    /**
     * Create a custom Account in the Chart of Accounts.
     */
    public function storeAccount(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:asset,liability,equity,revenue,expense',
            'sub_type' => 'required|string|max:100',
            'currency' => 'nullable|string|size:3',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $account = Account::create([
            'business_id' => $validated['business_id'],
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'sub_type' => $validated['sub_type'],
            'currency' => $validated['currency'] ?? 'INR',
            'is_system' => false,
            'status' => 'active',
        ]);

        return response()->json($account, 201);
    }

    /**
     * List posted Journal Entries.
     */
    public function journalEntries(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $query = JournalEntry::where('business_id', $validated['business_id'])
            ->with(['lines.account'])
            ->latest('entry_date');

        if (!empty($validated['from_date'])) {
            $query->where('entry_date', '>=', $validated['from_date']);
        }
        if (!empty($validated['to_date'])) {
            $query->where('entry_date', '<=', $validated['to_date']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Post a Manual Journal Voucher (JV).
     */
    public function postJournalEntry(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'entry_date' => 'required|date',
            'narration' => 'required|string|max:500',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|uuid|exists:accounts,id',
            'lines.*.party_type' => 'nullable|string|in:customer,supplier',
            'lines.*.party_id' => 'nullable|uuid',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string|max:255',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $entry = $this->accountingService->postJournalEntry(
            businessId: $validated['business_id'],
            entryDate: $validated['entry_date'],
            narration: $validated['narration'],
            lines: $validated['lines'],
            refType: 'manual'
        );

        return response()->json($entry, 201);
    }

    /**
     * List Payment Vouchers.
     */
    public function paymentVouchers(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'voucher_type' => 'nullable|string|in:receipt,payment,contra',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $query = PaymentVoucher::where('business_id', $validated['business_id'])
            ->with(['bankCashAccount', 'partyAccount'])
            ->latest('voucher_date');

        if (!empty($validated['voucher_type'])) {
            $query->where('voucher_type', $validated['voucher_type']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Record a Payment Voucher and automatically post to General Ledger.
     */
    public function storePaymentVoucher(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'voucher_type' => 'required|string|in:receipt,payment,contra',
            'voucher_date' => 'required|date',
            'bank_cash_account_id' => 'required|uuid|exists:accounts,id',
            'party_account_id' => 'required|uuid|exists:accounts,id',
            'party_type' => 'nullable|string|in:customer,supplier,other',
            'party_id' => 'nullable|uuid',
            'amount' => 'required|numeric|min:0.01',
            'payment_mode' => 'required|string|in:bank_transfer,upi,card,cash,cheque',
            'reference_number' => 'nullable|string|max:100',
            'reference_invoice_id' => 'nullable|uuid|exists:invoices,id',
            'narration' => 'nullable|string|max:500',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        return DB::transaction(function () use ($validated) {
            $date = Carbon::parse($validated['voucher_date']);
            $fyStart = $date->month >= 4 ? $date->year : $date->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $prefixMap = [
                'receipt' => 'RCT/',
                'payment' => 'PMT/',
                'contra' => 'CNT/',
            ];

            $primaryGstinId = DB::table('business_gstins')
                ->where('business_id', $validated['business_id'])
                ->where('is_primary', true)
                ->value('id')
                ?? DB::table('business_gstins')->where('business_id', $validated['business_id'])->value('id');

            $query = [
                'business_id' => $validated['business_id'],
                'document_type' => "voucher_{$validated['voucher_type']}",
                'financial_year' => $fyString,
            ];
            if ($primaryGstinId) {
                $query['business_gstin_id'] = $primaryGstinId;
            }

            $seq = InvoiceSequence::firstOrCreate(
                $query,
                [
                    'business_gstin_id' => $primaryGstinId,
                    'prefix' => $prefixMap[$validated['voucher_type']] ?? 'VCH/',
                    'next_number' => 1,
                ]
            );

            $voucherNumber = $seq->prefix . $fyString . '/' . str_pad((string) $seq->next_number, 4, '0', STR_PAD_LEFT);
            $seq->increment('next_number');

            $voucher = PaymentVoucher::create([
                'business_id' => $validated['business_id'],
                'voucher_number' => $voucherNumber,
                'voucher_type' => $validated['voucher_type'],
                'voucher_date' => $validated['voucher_date'],
                'bank_cash_account_id' => $validated['bank_cash_account_id'],
                'party_account_id' => $validated['party_account_id'],
                'party_type' => $validated['party_type'] ?? null,
                'party_id' => $validated['party_id'] ?? null,
                'amount' => bcdiv((string) $validated['amount'], '1', 2),
                'payment_mode' => $validated['payment_mode'],
                'reference_number' => $validated['reference_number'] ?? null,
                'reference_invoice_id' => $validated['reference_invoice_id'] ?? null,
                'narration' => $validated['narration'] ?? null,
                'status' => 'settled',
            ]);

            // Post double-entry to journal
            $this->accountingService->postPaymentVoucherRecord($voucher);

            // If linked to an invoice, update invoice paid amount
            if (!empty($validated['reference_invoice_id']) && $validated['voucher_type'] === 'receipt') {
                $invoice = Invoice::find($validated['reference_invoice_id']);
                if ($invoice) {
                    $newPaid = bcadd((string) $invoice->paid_amount, (string) $voucher->amount, 2);
                    $invoice->paid_amount = $newPaid;
                    if (bccomp($newPaid, (string) $invoice->grand_total, 2) >= 0) {
                        $invoice->status = 'paid';
                    } else {
                        $invoice->status = 'partially_paid';
                    }
                    $invoice->save();
                }
            }

            return response()->json($voucher->load(['bankCashAccount', 'partyAccount']), 201);
        });
    }

    /**
     * Financial Statements: Trial Balance.
     */
    public function trialBalance(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $report = $this->accountingService->generateTrialBalance(
            businessId: $validated['business_id'],
            fromDate: $validated['from_date'] ?? null,
            toDate: $validated['to_date'] ?? null
        );

        return response()->json($report);
    }

    /**
     * Financial Statements: Profit & Loss Statement.
     */
    public function profitLoss(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $report = $this->accountingService->generateProfitAndLoss(
            businessId: $validated['business_id'],
            fromDate: $validated['from_date'] ?? null,
            toDate: $validated['to_date'] ?? null
        );

        return response()->json($report);
    }

    /**
     * Financial Statements: Balance Sheet.
     */
    public function balanceSheet(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'as_of_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $report = $this->accountingService->generateBalanceSheet(
            businessId: $validated['business_id'],
            asOfDate: $validated['as_of_date'] ?? null
        );

        return response()->json($report);
    }

    /**
     * Statement of Accounts: Customer or Vendor Running Ledger.
     */
    public function partyLedger(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'party_type' => 'required|string|in:customer,supplier',
            'party_id' => 'required|uuid',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $report = $this->accountingService->generatePartyLedger(
            businessId: $validated['business_id'],
            partyType: $validated['party_type'],
            partyId: $validated['party_id'],
            fromDate: $validated['from_date'] ?? null,
            toDate: $validated['to_date'] ?? null
        );

        return response()->json($report);
    }
}
