<?php

namespace App\Modules\GSTEngine\Services;

use App\Models\PurchaseBill;
use Carbon\Carbon;

class Gstr2bReconciliationService
{
    /**
     * Reconcile Purchase Bills (Books) against GST Portal GSTR-2B Inward Data.
     */
    public function reconcile(string $businessId, string $returnPeriod, array $gstr2bData): array
    {
        // 1. Fetch Purchase Bills for the business in the given period
        $startDate = Carbon::createFromFormat('Y-m', $returnPeriod)->startOfMonth()->toDateString();
        $endDate = Carbon::createFromFormat('Y-m', $returnPeriod)->endOfMonth()->toDateString();

        $booksBills = PurchaseBill::where('business_id', $businessId)
            ->whereBetween('bill_date', [$startDate, $endDate])
            ->with(['supplier', 'businessGstin'])
            ->get();

        $matched = [];
        $taxMismatch = [];
        $missingInPortal = [];
        $missingInBooks = [];
        $ineligibleItc = [];

        $portalInvoices = [];
        // Flatten B2B section from GSTR-2B portal JSON
        // Structure: ['data' => ['b2b' => [ ['ctin' => '27...', 'inv' => [ ['inum' => 'INV-1', 'val' => 1180, 'taxable' => 1000, 'cgst' => 90, ...] ] ] ] ]
        $b2bList = $gstr2bData['data']['b2b'] ?? $gstr2bData['b2b'] ?? [];
        foreach ($b2bList as $sup) {
            $ctin = strtoupper(trim($sup['ctin'] ?? ''));
            $invList = $sup['inv'] ?? [];
            foreach ($invList as $inv) {
                $inum = strtoupper(trim((string)($inv['inum'] ?? '')));
                $key = "{$ctin}_{$inum}";
                $portalInvoices[$key] = [
                    'supplier_gstin' => $ctin,
                    'invoice_number' => $inum,
                    'invoice_date' => $inv['dt'] ?? '',
                    'invoice_value' => (string)($inv['val'] ?? '0.00'),
                    'taxable_value' => (string)($inv['taxable'] ?? $inv['txval'] ?? '0.00'),
                    'igst' => (string)($inv['igst'] ?? $inv['iamt'] ?? '0.00'),
                    'cgst' => (string)($inv['cgst'] ?? $inv['camt'] ?? '0.00'),
                    'sgst' => (string)($inv['sgst'] ?? $inv['samt'] ?? '0.00'),
                    'cess' => (string)($inv['cess'] ?? $inv['csamt'] ?? '0.00'),
                    'itc_available' => ($inv['itcavl'] ?? 'Y') === 'Y',
                ];
            }
        }

        $processedPortalKeys = [];

        // 2. Loop through Books and compare
        foreach ($booksBills as $bill) {
            $supGstin = strtoupper(trim($bill->supplier?->gstin ?? ''));
            $billNum = strtoupper(trim($bill->bill_number));
            $key = "{$supGstin}_{$billNum}";

            // Check Section 17(5) Ineligible ITC
            if ($bill->itc_eligibility === 'ineligible') {
                $ineligibleItc[] = [
                    'bill_id' => $bill->id,
                    'bill_number' => $bill->bill_number,
                    'supplier_name' => $bill->supplier?->name,
                    'supplier_gstin' => $supGstin,
                    'tax_amount' => (string) $bill->total_tax_amount,
                    'reason' => 'Blocked Credit under Section 17(5) of CGST Act',
                ];
                continue;
            }

            if (isset($portalInvoices[$key])) {
                $portalInv = $portalInvoices[$key];
                $processedPortalKeys[$key] = true;

                $bookTax = (string) $bill->total_tax_amount;
                $portalTax = bcadd(bcadd(bcadd($portalInv['igst'], $portalInv['cgst'], 2), $portalInv['sgst'], 2), $portalInv['cess'], 2);

                $taxDiff = bcsub($bookTax, $portalTax, 2);

                // Tolerance check (+/- ₹2.00)
                if (abs((float)$taxDiff) <= 2.00) {
                    $matched[] = [
                        'bill_id' => $bill->id,
                        'bill_number' => $bill->bill_number,
                        'supplier_name' => $bill->supplier?->name,
                        'supplier_gstin' => $supGstin,
                        'book_taxable' => (string) $bill->total_taxable_value,
                        'portal_taxable' => $portalInv['taxable_value'],
                        'book_tax' => $bookTax,
                        'portal_tax' => $portalTax,
                        'status' => 'MATCHED',
                    ];
                } else {
                    $taxMismatch[] = [
                        'bill_id' => $bill->id,
                        'bill_number' => $bill->bill_number,
                        'supplier_name' => $bill->supplier?->name,
                        'supplier_gstin' => $supGstin,
                        'book_tax' => $bookTax,
                        'portal_tax' => $portalTax,
                        'difference' => $taxDiff,
                        'status' => 'TAX_MISMATCH',
                    ];
                }
            } else {
                $missingInPortal[] = [
                    'bill_id' => $bill->id,
                    'bill_number' => $bill->bill_number,
                    'bill_date' => Carbon::parse($bill->bill_date)->format('Y-m-d'),
                    'supplier_name' => $bill->supplier?->name,
                    'supplier_gstin' => $supGstin,
                    'tax_amount' => (string) $bill->total_tax_amount,
                    'risk' => 'ITC claim blocked under Section 16(2)(aa) until supplier files GSTR-1',
                    'status' => 'MISSING_IN_GSTR2B',
                ];
            }
        }

        // 3. Find portal entries not present in books
        foreach ($portalInvoices as $k => $pInv) {
            if (!isset($processedPortalKeys[$k])) {
                $missingInBooks[] = [
                    'supplier_gstin' => $pInv['supplier_gstin'],
                    'invoice_number' => $pInv['invoice_number'],
                    'invoice_date' => $pInv['invoice_date'],
                    'taxable_value' => $pInv['taxable_value'],
                    'tax_amount' => bcadd(bcadd(bcadd($pInv['igst'], $pInv['cgst'], 2), $pInv['sgst'], 2), $pInv['cess'], 2),
                    'action_required' => 'Record inward purchase bill to claim eligible ITC',
                    'status' => 'MISSING_IN_BOOKS',
                ];
            }
        }

        $totalEligibleItc = '0.00';
        foreach ($matched as $m) {
            $totalEligibleItc = bcadd($totalEligibleItc, $m['portal_tax'], 2);
        }

        return [
            'business_id' => $businessId,
            'return_period' => $returnPeriod,
            'summary' => [
                'total_bills_in_books' => $booksBills->count(),
                'total_invoices_in_portal' => count($portalInvoices),
                'matched_count' => count($matched),
                'tax_mismatch_count' => count($taxMismatch),
                'missing_in_portal_count' => count($missingInPortal),
                'missing_in_books_count' => count($missingInBooks),
                'ineligible_itc_count' => count($ineligibleItc),
                'total_eligible_itc_confirmed' => $totalEligibleItc,
            ],
            'matched' => $matched,
            'tax_mismatches' => $taxMismatch,
            'missing_in_portal' => $missingInPortal,
            'missing_in_books' => $missingInBooks,
            'ineligible_itc' => $ineligibleItc,
        ];
    }
}
