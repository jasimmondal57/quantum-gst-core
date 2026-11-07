<?php

namespace App\Services;

use App\Models\Account;
use App\Models\CreditDebitNote;
use App\Models\Invoice;
use App\Models\InvoiceSequence;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\PaymentVoucher;
use App\Models\PurchaseBill;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AccountingEngineService
{
    /**
     * Standard Indian statutory Chart of Accounts blueprint.
     */
    public const STANDARD_COA = [
        // Assets (1000 - 1999)
        ['code' => '1010', 'name' => 'Cash in Hand', 'type' => 'asset', 'sub_type' => 'cash'],
        ['code' => '1020', 'name' => 'Bank Accounts', 'type' => 'asset', 'sub_type' => 'bank'],
        ['code' => '1030', 'name' => 'Accounts Receivable (Sundry Debtors)', 'type' => 'asset', 'sub_type' => 'accounts_receivable'],
        ['code' => '1040', 'name' => 'Input Tax Credit - CGST', 'type' => 'asset', 'sub_type' => 'statutory_itc_receivable'],
        ['code' => '1041', 'name' => 'Input Tax Credit - SGST/UTGST', 'type' => 'asset', 'sub_type' => 'statutory_itc_receivable'],
        ['code' => '1042', 'name' => 'Input Tax Credit - IGST', 'type' => 'asset', 'sub_type' => 'statutory_itc_receivable'],
        ['code' => '1043', 'name' => 'Input Tax Credit - GST Cess', 'type' => 'asset', 'sub_type' => 'statutory_itc_receivable'],
        ['code' => '1050', 'name' => 'Stock-in-Trade (Inventory)', 'type' => 'asset', 'sub_type' => 'current_asset'],

        // Liabilities (2000 - 2999)
        ['code' => '2010', 'name' => 'Accounts Payable (Sundry Creditors)', 'type' => 'liability', 'sub_type' => 'accounts_payable'],
        ['code' => '2020', 'name' => 'Output CGST Payable', 'type' => 'liability', 'sub_type' => 'statutory_tax_payable'],
        ['code' => '2021', 'name' => 'Output SGST/UTGST Payable', 'type' => 'liability', 'sub_type' => 'statutory_tax_payable'],
        ['code' => '2022', 'name' => 'Output IGST Payable', 'type' => 'liability', 'sub_type' => 'statutory_tax_payable'],
        ['code' => '2023', 'name' => 'Output GST Cess Payable', 'type' => 'liability', 'sub_type' => 'statutory_tax_payable'],
        ['code' => '2030', 'name' => 'Reverse Charge (RCM) Payable', 'type' => 'liability', 'sub_type' => 'statutory_tax_payable'],

        // Equity (3000 - 3999)
        ['code' => '3010', 'name' => "Owner's Capital Account", 'type' => 'equity', 'sub_type' => 'equity'],
        ['code' => '3020', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'retained_earnings'],

        // Revenue (4000 - 4999)
        ['code' => '4010', 'name' => 'Sales Revenue (Taxable Supplies)', 'type' => 'revenue', 'sub_type' => 'operating_revenue'],
        ['code' => '4020', 'name' => 'Export Sales Revenue', 'type' => 'revenue', 'sub_type' => 'operating_revenue'],
        ['code' => '4030', 'name' => 'Nil-Rated & Exempted Sales Revenue', 'type' => 'revenue', 'sub_type' => 'operating_revenue'],
        ['code' => '4090', 'name' => 'Other Business Income', 'type' => 'revenue', 'sub_type' => 'other_income'],

        // Expenses (5000 - 5999)
        ['code' => '5010', 'name' => 'Cost of Goods Sold / Purchases', 'type' => 'expense', 'sub_type' => 'direct_expense'],
        ['code' => '5020', 'name' => 'Logistics & Courier Charges', 'type' => 'expense', 'sub_type' => 'operating_expense'],
        ['code' => '5030', 'name' => 'Office Rent & Utilities', 'type' => 'expense', 'sub_type' => 'operating_expense'],
        ['code' => '5040', 'name' => 'Staff Salaries & Stipends', 'type' => 'expense', 'sub_type' => 'operating_expense'],
        ['code' => '5050', 'name' => 'Marketplace Fees & Commissions', 'type' => 'expense', 'sub_type' => 'operating_expense'],
        ['code' => '5090', 'name' => 'Round Off & Fractional Adjustments', 'type' => 'expense', 'sub_type' => 'operating_expense'],
    ];

    /**
     * Ensure the business has standard statutory accounts provisioned.
     */
    public function ensureStandardChartOfAccounts(string $businessId): void
    {
        $existingCodes = Account::where('business_id', $businessId)->pluck('code')->toArray();

        $toInsert = [];
        $now = now();
        foreach (self::STANDARD_COA as $acc) {
            if (!in_array($acc['code'], $existingCodes, true)) {
                $toInsert[] = [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'business_id' => $businessId,
                    'code' => $acc['code'],
                    'name' => $acc['name'],
                    'type' => $acc['type'],
                    'sub_type' => $acc['sub_type'],
                    'currency' => 'INR',
                    'is_system' => true,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (!empty($toInsert)) {
            Account::insert($toInsert);
        }
    }

    /**
     * Get a specific account by code for a business.
     */
    public function getAccount(string $businessId, string $code): Account
    {
        $this->ensureStandardChartOfAccounts($businessId);
        return Account::where('business_id', $businessId)->where('code', $code)->firstOrFail();
    }

    /**
     * Post a balanced double-entry transaction.
     */
    public function postJournalEntry(
        string $businessId,
        string $entryDate,
        string $narration,
        array $lines,
        ?string $refType = null,
        ?string $refId = null
    ): JournalEntry {
        $totalDebit = '0.00';
        $totalCredit = '0.00';

        foreach ($lines as $line) {
            $totalDebit = bcadd($totalDebit, (string) ($line['debit'] ?? '0.00'), 2);
            $totalCredit = bcadd($totalCredit, (string) ($line['credit'] ?? '0.00'), 2);
        }

        if (bccomp($totalDebit, $totalCredit, 2) !== 0) {
            throw new InvalidArgumentException(
                "Accounting Invariant Violation: Debits (₹{$totalDebit}) must equal Credits (₹{$totalCredit})."
            );
        }

        $date = Carbon::parse($entryDate);
        $fyStart = $date->month >= 4 ? $date->year : $date->year - 1;
        $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

        $primaryGstinId = DB::table('business_gstins')
            ->where('business_id', $businessId)
            ->where('is_primary', true)
            ->value('id')
            ?? DB::table('business_gstins')->where('business_id', $businessId)->value('id');

        $query = [
            'business_id' => $businessId,
            'document_type' => 'journal_entry',
            'financial_year' => $fyString,
        ];
        if ($primaryGstinId) {
            $query['business_gstin_id'] = $primaryGstinId;
        }

        $seq = InvoiceSequence::firstOrCreate(
            $query,
            [
                'business_gstin_id' => $primaryGstinId,
                'prefix' => 'JV/',
                'next_number' => 1,
            ]
        );

        $entryNumber = $seq->prefix . $fyString . '/' . str_pad((string) $seq->next_number, 4, '0', STR_PAD_LEFT);
        $seq->increment('next_number');

        return DB::transaction(function () use (
            $businessId,
            $entryNumber,
            $entryDate,
            $refType,
            $refId,
            $narration,
            $totalDebit,
            $totalCredit,
            $lines
        ) {
            $entry = JournalEntry::create([
                'business_id' => $businessId,
                'entry_number' => $entryNumber,
                'entry_date' => $entryDate,
                'reference_type' => $refType,
                'reference_id' => $refId,
                'narration' => $narration,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'status' => 'posted',
            ]);

            foreach ($lines as $l) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $l['account_id'],
                    'party_type' => $l['party_type'] ?? null,
                    'party_id' => $l['party_id'] ?? null,
                    'debit' => bcdiv((string) ($l['debit'] ?? '0.00'), '1', 2),
                    'credit' => bcdiv((string) ($l['credit'] ?? '0.00'), '1', 2),
                    'description' => $l['description'] ?? null,
                ]);
            }

            return $entry->load('lines.account');
        });
    }

    /**
     * Automatically post double-entry ledger records for an Issued Tax Invoice.
     */
    public function postInvoice(Invoice $invoice): JournalEntry
    {
        $bizId = $invoice->business_id;
        $this->ensureStandardChartOfAccounts($bizId);

        $arAccount = $this->getAccount($bizId, '1030'); // Accounts Receivable
        $salesAccount = $this->getAccount($bizId, '4010'); // Sales Revenue
        $cgstAccount = $this->getAccount($bizId, '2020'); // Output CGST
        $sgstAccount = $this->getAccount($bizId, '2021'); // Output SGST/UTGST
        $igstAccount = $this->getAccount($bizId, '2022'); // Output IGST
        $cessAccount = $this->getAccount($bizId, '2023'); // Output Cess
        $roundOffAccount = $this->getAccount($bizId, '5090'); // Round Off Expense

        $lines = [];

        // 1. Debit Accounts Receivable (Customer) for Grand Total
        $lines[] = [
            'account_id' => $arAccount->id,
            'party_type' => 'customer',
            'party_id' => $invoice->customer_id,
            'debit' => (string) $invoice->grand_total,
            'credit' => '0.00',
            'description' => "Invoice #{$invoice->invoice_number} outward supply",
        ];

        // 2. Credit Sales Revenue for Taxable Turnover
        $lines[] = [
            'account_id' => $salesAccount->id,
            'debit' => '0.00',
            'credit' => (string) $invoice->total_taxable_value,
            'description' => "Taxable sales turnover for #{$invoice->invoice_number}",
        ];

        // 3. Credit Statutory Output Taxes
        if (bccomp((string) $invoice->total_cgst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $cgstAccount->id,
                'debit' => '0.00',
                'credit' => (string) $invoice->total_cgst,
                'description' => 'Output CGST statutory tax payable',
            ];
        }

        if (bccomp((string) $invoice->total_sgst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $sgstAccount->id,
                'debit' => '0.00',
                'credit' => (string) $invoice->total_sgst,
                'description' => 'Output SGST/UTGST statutory tax payable',
            ];
        }

        if (bccomp((string) $invoice->total_igst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $igstAccount->id,
                'debit' => '0.00',
                'credit' => (string) $invoice->total_igst,
                'description' => 'Output IGST statutory tax payable',
            ];
        }

        if (bccomp((string) ($invoice->total_cess ?? '0.00'), '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $cessAccount->id,
                'debit' => '0.00',
                'credit' => (string) $invoice->total_cess,
                'description' => 'Output GST Cess statutory tax payable',
            ];
        }

        // 4. Exact Double-Entry Balance Calculation for Rounding Off
        $currentDebits = (string) $invoice->grand_total;
        $currentCredits = '0.00';
        foreach ($lines as $l) {
            $currentCredits = bcadd($currentCredits, (string) $l['credit'], 2);
        }

        $diff = bcsub($currentDebits, $currentCredits, 2);
        if (bccomp($diff, '0.00', 2) > 0) {
            // Need more credit to balance grand total
            $lines[] = [
                'account_id' => $roundOffAccount->id,
                'debit' => '0.00',
                'credit' => $diff,
                'description' => 'Invoice rounding off adjustment',
            ];
        } elseif (bccomp($diff, '0.00', 2) < 0) {
            // Need more debit to balance grand total
            $lines[] = [
                'account_id' => $roundOffAccount->id,
                'debit' => bcsub('0.00', $diff, 2),
                'credit' => '0.00',
                'description' => 'Invoice rounding off adjustment',
            ];
        }

        return $this->postJournalEntry(
            businessId: $bizId,
            entryDate: Carbon::parse($invoice->invoice_date)->format('Y-m-d'),
            narration: "Statutory Tax Invoice #{$invoice->invoice_number} generated",
            lines: $lines,
            refType: 'invoice',
            refId: $invoice->id
        );
    }

    /**
     * Automatically post double-entry records for an Inward Purchase Bill.
     */
    public function postPurchaseBill(PurchaseBill $bill): JournalEntry
    {
        $bizId = $bill->business_id;
        $this->ensureStandardChartOfAccounts($bizId);

        $apAccount = $this->getAccount($bizId, '2010'); // Sundry Creditors
        $purchasesAccount = $this->getAccount($bizId, '5010'); // Cost of Goods Sold / Purchases
        $itcCgstAccount = $this->getAccount($bizId, '1040'); // ITC CGST
        $itcSgstAccount = $this->getAccount($bizId, '1041'); // ITC SGST
        $itcIgstAccount = $this->getAccount($bizId, '1042'); // ITC IGST
        $itcCessAccount = $this->getAccount($bizId, '1043'); // ITC Cess
        $roundOffAccount = $this->getAccount($bizId, '5090');

        $lines = [];

        // 1. Debit Purchases / COGS
        $lines[] = [
            'account_id' => $purchasesAccount->id,
            'debit' => (string) $bill->total_taxable_value,
            'credit' => '0.00',
            'description' => "Purchase turnover for Bill #{$bill->bill_number}",
        ];

        // 2. Debit Input Tax Credit (ITC)
        if (bccomp((string) $bill->total_cgst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $itcCgstAccount->id,
                'debit' => (string) $bill->total_cgst,
                'credit' => '0.00',
                'description' => 'Input Tax Credit - CGST',
            ];
        }

        if (bccomp((string) $bill->total_sgst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $itcSgstAccount->id,
                'debit' => (string) $bill->total_sgst,
                'credit' => '0.00',
                'description' => 'Input Tax Credit - SGST/UTGST',
            ];
        }

        if (bccomp((string) $bill->total_igst, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $itcIgstAccount->id,
                'debit' => (string) $bill->total_igst,
                'credit' => '0.00',
                'description' => 'Input Tax Credit - IGST',
            ];
        }

        if (bccomp((string) ($bill->total_cess ?? '0.00'), '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $itcCessAccount->id,
                'debit' => (string) $bill->total_cess,
                'credit' => '0.00',
                'description' => 'Input Tax Credit - GST Cess',
            ];
        }

        // 3. Credit Sundry Creditors (Accounts Payable)
        $lines[] = [
            'account_id' => $apAccount->id,
            'party_type' => 'supplier',
            'party_id' => $bill->supplier_id,
            'debit' => '0.00',
            'credit' => (string) $bill->grand_total,
            'description' => "Purchase Bill #{$bill->bill_number} inward liability",
        ];

        // 4. Exact Double-Entry Balance Calculation for Rounding Off
        $currentDebits = '0.00';
        $currentCredits = (string) $bill->grand_total;
        foreach ($lines as $l) {
            $currentDebits = bcadd($currentDebits, (string) $l['debit'], 2);
        }

        $diff = bcsub($currentCredits, $currentDebits, 2);
        if (bccomp($diff, '0.00', 2) > 0) {
            // Need more debit to balance grand total
            $lines[] = [
                'account_id' => $roundOffAccount->id,
                'debit' => $diff,
                'credit' => '0.00',
                'description' => 'Purchase rounding off adjustment',
            ];
        } elseif (bccomp($diff, '0.00', 2) < 0) {
            // Need more credit to balance grand total
            $lines[] = [
                'account_id' => $roundOffAccount->id,
                'debit' => '0.00',
                'credit' => bcsub('0.00', $diff, 2),
                'description' => 'Purchase rounding off adjustment',
            ];
        }

        return $this->postJournalEntry(
            businessId: $bizId,
            entryDate: Carbon::parse($bill->bill_date)->format('Y-m-d'),
            narration: "Inward Purchase Bill #{$bill->bill_number} booked",
            lines: $lines,
            refType: 'purchase_bill',
            refId: $bill->id
        );
    }

    /**
     * Automatically post double-entry reversal records for a Credit Note.
     */
    public function postCreditNote(CreditDebitNote $note): JournalEntry
    {
        $bizId = $note->business_id;
        $this->ensureStandardChartOfAccounts($bizId);

        $arAccount = $this->getAccount($bizId, '1030');
        $salesAccount = $this->getAccount($bizId, '4010');
        $cgstAccount = $this->getAccount($bizId, '2020');
        $sgstAccount = $this->getAccount($bizId, '2021');
        $igstAccount = $this->getAccount($bizId, '2022');

        $lines = [];

        // Debit Sales Return / Revenue adjustment
        $lines[] = [
            'account_id' => $salesAccount->id,
            'debit' => (string) $note->taxable_value,
            'credit' => '0.00',
            'description' => "Credit Note #{$note->note_number} sales adjustment",
        ];

        // Debit Output Taxes reversed
        if (bccomp((string) $note->cgst_amount, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $cgstAccount->id,
                'debit' => (string) $note->cgst_amount,
                'credit' => '0.00',
                'description' => 'Reversal of Output CGST',
            ];
        }

        if (bccomp((string) $note->sgst_amount, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $sgstAccount->id,
                'debit' => (string) $note->sgst_amount,
                'credit' => '0.00',
                'description' => 'Reversal of Output SGST/UTGST',
            ];
        }

        if (bccomp((string) $note->igst_amount, '0.00', 2) > 0) {
            $lines[] = [
                'account_id' => $igstAccount->id,
                'debit' => (string) $note->igst_amount,
                'credit' => '0.00',
                'description' => 'Reversal of Output IGST',
            ];
        }

        // Credit Accounts Receivable (Customer)
        $lines[] = [
            'account_id' => $arAccount->id,
            'party_type' => 'customer',
            'party_id' => $note->originalInvoice?->customer_id,
            'debit' => '0.00',
            'credit' => (string) $note->total_amount,
            'description' => "Credit adjustment for #{$note->originalInvoice?->invoice_number}",
        ];

        return $this->postJournalEntry(
            businessId: $bizId,
            entryDate: Carbon::parse($note->note_date)->format('Y-m-d'),
            narration: "Credit Note #{$note->note_number} issued for {$note->reason}",
            lines: $lines,
            refType: 'credit_note',
            refId: $note->id
        );
    }

    /**
     * Post a Payment Voucher (Receipt, Payment, or Contra).
     */
    public function postPaymentVoucherRecord(PaymentVoucher $voucher): JournalEntry
    {
        $bizId = $voucher->business_id;
        $lines = [];

        $amt = (string) $voucher->amount;

        if ($voucher->voucher_type === 'receipt') {
            // Money Received: Debit Bank/Cash, Credit Party (Customer AR)
            $lines[] = [
                'account_id' => $voucher->bank_cash_account_id,
                'debit' => $amt,
                'credit' => '0.00',
                'description' => "Payment received via {$voucher->payment_mode} (Ref: {$voucher->reference_number})",
            ];
            $lines[] = [
                'account_id' => $voucher->party_account_id,
                'party_type' => $voucher->party_type,
                'party_id' => $voucher->party_id,
                'debit' => '0.00',
                'credit' => $amt,
                'description' => "Settlement of customer receivables",
            ];
        } elseif ($voucher->voucher_type === 'payment') {
            // Money Disbursed: Debit Party (Vendor AP), Credit Bank/Cash
            $lines[] = [
                'account_id' => $voucher->party_account_id,
                'party_type' => $voucher->party_type,
                'party_id' => $voucher->party_id,
                'debit' => $amt,
                'credit' => '0.00',
                'description' => "Payment disbursed to party",
            ];
            $lines[] = [
                'account_id' => $voucher->bank_cash_account_id,
                'debit' => '0.00',
                'credit' => $amt,
                'description' => "Funds disbursed via {$voucher->payment_mode}",
            ];
        } else {
            // Contra: Transfer between own bank and cash accounts
            $lines[] = [
                'account_id' => $voucher->bank_cash_account_id,
                'debit' => $amt,
                'credit' => '0.00',
                'description' => "Transfer in to account",
            ];
            $lines[] = [
                'account_id' => $voucher->party_account_id,
                'debit' => '0.00',
                'credit' => $amt,
                'description' => "Transfer out from account",
            ];
        }

        return $this->postJournalEntry(
            businessId: $bizId,
            entryDate: Carbon::parse($voucher->voucher_date)->format('Y-m-d'),
            narration: "Payment Voucher #{$voucher->voucher_number} posted",
            lines: $lines,
            refType: 'payment',
            refId: $voucher->id
        );
    }

    /**
     * Generate Period Trial Balance (Double-Entry Verification).
     */
    public function generateTrialBalance(string $businessId, ?string $fromDate = null, ?string $toDate = null): array
    {
        $this->ensureStandardChartOfAccounts($businessId);

        $accounts = Account::where('business_id', $businessId)->orderBy('code')->get();

        $rows = [];
        $totalDebit = '0.00';
        $totalCredit = '0.00';

        foreach ($accounts as $acc) {
            $query = JournalEntryLine::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($jq) use ($businessId, $fromDate, $toDate) {
                    $jq->where('business_id', $businessId)->where('status', 'posted');
                    if ($fromDate) {
                        $jq->where('entry_date', '>=', $fromDate);
                    }
                    if ($toDate) {
                        $jq->where('entry_date', '<=', $toDate);
                    }
                });

            $debitSum = (string) ($query->sum('debit') ?? '0.00');
            $creditSum = (string) ($query->sum('credit') ?? '0.00');

            if (bccomp($debitSum, '0.00', 2) === 0 && bccomp($creditSum, '0.00', 2) === 0) {
                continue;
            }

            $totalDebit = bcadd($totalDebit, $debitSum, 2);
            $totalCredit = bcadd($totalCredit, $creditSum, 2);

            $rows[] = [
                'account_id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type,
                'sub_type' => $acc->sub_type,
                'debit' => bcdiv($debitSum, '1', 2),
                'credit' => bcdiv($creditSum, '1', 2),
            ];
        }

        return [
            'business_id' => $businessId,
            'period' => ['from' => $fromDate, 'to' => $toDate],
            'is_balanced' => bccomp($totalDebit, $totalCredit, 2) === 0,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'difference' => bcsub($totalDebit, $totalCredit, 2),
            'accounts' => $rows,
        ];
    }

    /**
     * Generate Profit and Loss Statement.
     */
    public function generateProfitAndLoss(string $businessId, ?string $fromDate = null, ?string $toDate = null): array
    {
        $this->ensureStandardChartOfAccounts($businessId);

        // Revenue: Net credits
        $revenueAccounts = Account::where('business_id', $businessId)->where('type', 'revenue')->get();
        $revenueRows = [];
        $totalRevenue = '0.00';

        foreach ($revenueAccounts as $acc) {
            $lines = JournalEntryLine::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($jq) use ($businessId, $fromDate, $toDate) {
                    $jq->where('business_id', $businessId)->where('status', 'posted');
                    if ($fromDate) $jq->where('entry_date', '>=', $fromDate);
                    if ($toDate) $jq->where('entry_date', '<=', $toDate);
                })->get();

            $credits = (string) $lines->sum('credit');
            $debits = (string) $lines->sum('debit');
            $net = bcsub($credits, $debits, 2);

            if (bccomp($net, '0.00', 2) !== 0) {
                $totalRevenue = bcadd($totalRevenue, $net, 2);
                $revenueRows[] = ['code' => $acc->code, 'name' => $acc->name, 'amount' => $net];
            }
        }

        // Expenses: Net debits
        $expenseAccounts = Account::where('business_id', $businessId)->where('type', 'expense')->get();
        $expenseRows = [];
        $totalExpenses = '0.00';

        foreach ($expenseAccounts as $acc) {
            $lines = JournalEntryLine::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($jq) use ($businessId, $fromDate, $toDate) {
                    $jq->where('business_id', $businessId)->where('status', 'posted');
                    if ($fromDate) $jq->where('entry_date', '>=', $fromDate);
                    if ($toDate) $jq->where('entry_date', '<=', $toDate);
                })->get();

            $debits = (string) $lines->sum('debit');
            $credits = (string) $lines->sum('credit');
            $net = bcsub($debits, $credits, 2);

            if (bccomp($net, '0.00', 2) !== 0) {
                $totalExpenses = bcadd($totalExpenses, $net, 2);
                $expenseRows[] = ['code' => $acc->code, 'name' => $acc->name, 'amount' => $net];
            }
        }

        $netProfit = bcsub($totalRevenue, $totalExpenses, 2);

        return [
            'business_id' => $businessId,
            'period' => ['from' => $fromDate, 'to' => $toDate],
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'revenue_items' => $revenueRows,
            'expense_items' => $expenseRows,
        ];
    }

    /**
     * Generate Balance Sheet (Assets = Liabilities + Equity).
     */
    public function generateBalanceSheet(string $businessId, ?string $asOfDate = null): array
    {
        $this->ensureStandardChartOfAccounts($businessId);

        $getAccountNet = function (Account $acc, string $normalSide) use ($businessId, $asOfDate) {
            $lines = JournalEntryLine::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($jq) use ($businessId, $asOfDate) {
                    $jq->where('business_id', $businessId)->where('status', 'posted');
                    if ($asOfDate) $jq->where('entry_date', '<=', $asOfDate);
                })->get();

            $debits = (string) $lines->sum('debit');
            $credits = (string) $lines->sum('credit');

            return $normalSide === 'debit' ? bcsub($debits, $credits, 2) : bcsub($credits, $debits, 2);
        };

        // 1. Assets (Normal Debit side)
        $assetAccounts = Account::where('business_id', $businessId)->where('type', 'asset')->get();
        $assetRows = [];
        $totalAssets = '0.00';

        foreach ($assetAccounts as $acc) {
            $val = $getAccountNet($acc, 'debit');
            if (bccomp($val, '0.00', 2) !== 0) {
                $totalAssets = bcadd($totalAssets, $val, 2);
                $assetRows[] = ['code' => $acc->code, 'name' => $acc->name, 'amount' => $val];
            }
        }

        // 2. Liabilities (Normal Credit side)
        $liabilityAccounts = Account::where('business_id', $businessId)->where('type', 'liability')->get();
        $liabilityRows = [];
        $totalLiabilities = '0.00';

        foreach ($liabilityAccounts as $acc) {
            $val = $getAccountNet($acc, 'credit');
            if (bccomp($val, '0.00', 2) !== 0) {
                $totalLiabilities = bcadd($totalLiabilities, $val, 2);
                $liabilityRows[] = ['code' => $acc->code, 'name' => $acc->name, 'amount' => $val];
            }
        }

        // 3. Equity (Normal Credit side) + Net Retained Profit
        $equityAccounts = Account::where('business_id', $businessId)->where('type', 'equity')->get();
        $equityRows = [];
        $totalEquity = '0.00';

        foreach ($equityAccounts as $acc) {
            $val = $getAccountNet($acc, 'credit');
            if (bccomp($val, '0.00', 2) !== 0) {
                $totalEquity = bcadd($totalEquity, $val, 2);
                $equityRows[] = ['code' => $acc->code, 'name' => $acc->name, 'amount' => $val];
            }
        }

        // P&L Net Profit transferred into equity
        $pnl = $this->generateProfitAndLoss($businessId, null, $asOfDate);
        $netProfit = $pnl['net_profit'];
        $totalEquity = bcadd($totalEquity, $netProfit, 2);
        $equityRows[] = ['code' => 'P&L', 'name' => 'Current Period Retained Profit/Loss', 'amount' => $netProfit];

        $totalLiabilitiesAndEquity = bcadd($totalLiabilities, $totalEquity, 2);

        return [
            'business_id' => $businessId,
            'as_of_date' => $asOfDate ?? now()->format('Y-m-d'),
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity' => $totalEquity,
            'total_liabilities_and_equity' => $totalLiabilitiesAndEquity,
            'is_balanced' => bccomp($totalAssets, $totalLiabilitiesAndEquity, 2) === 0,
            'assets' => $assetRows,
            'liabilities' => $liabilityRows,
            'equity' => $equityRows,
        ];
    }

    /**
     * Generate Customer or Supplier Statement of Account (Running Ledger).
     */
    public function generatePartyLedger(
        string $businessId,
        string $partyType,
        string $partyId,
        ?string $fromDate = null,
        ?string $toDate = null
    ): array {
        $lines = JournalEntryLine::where('party_type', $partyType)
            ->where('party_id', $partyId)
            ->whereHas('journalEntry', function ($jq) use ($businessId, $fromDate, $toDate) {
                $jq->where('business_id', $businessId)->where('status', 'posted');
                if ($fromDate) $jq->where('entry_date', '>=', $fromDate);
                if ($toDate) $jq->where('entry_date', '<=', $toDate);
            })
            ->with(['journalEntry', 'account'])
            ->get();

        $runningBalance = '0.00';
        $totalDebit = '0.00';
        $totalCredit = '0.00';
        $entries = [];

        foreach ($lines as $l) {
            $debit = (string) $l->debit;
            $credit = (string) $l->credit;

            $totalDebit = bcadd($totalDebit, $debit, 2);
            $totalCredit = bcadd($totalCredit, $credit, 2);

            // For Customers (Receivables): Debit increases balance, Credit reduces balance
            if ($partyType === 'customer') {
                $runningBalance = bcadd(bcsub($runningBalance, $credit, 2), $debit, 2);
            } else {
                // For Suppliers (Payables): Credit increases liability, Debit reduces liability
                $runningBalance = bcadd(bcsub($runningBalance, $debit, 2), $credit, 2);
            }

            $entries[] = [
                'date' => Carbon::parse($l->journalEntry->entry_date)->format('Y-m-d'),
                'entry_number' => $l->journalEntry->entry_number,
                'reference_type' => $l->journalEntry->reference_type,
                'account_name' => $l->account->name,
                'description' => $l->description ?? $l->journalEntry->narration,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
            ];
        }

        return [
            'business_id' => $businessId,
            'party_type' => $partyType,
            'party_id' => $partyId,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'closing_balance' => $runningBalance,
            'entries' => $entries,
        ];
    }
}
