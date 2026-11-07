<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditDebitNote;
use App\Models\Invoice;
use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GstReportController extends Controller
{
    /**
     * Statutory GSTR-1 Outward Supplies Return.
     * Tables: B2B (4), B2CL (5), B2CS (7), CDNR (9B), CDNUR (9B), EXP (6A), HSN (12), DOCS (13)
     */
    public function gstr1(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'month' => 'nullable|integer|between:1,12',
            'year' => 'nullable|integer|between:2020,2035',
        ]);

        // Multi-Tenant Isolation
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

        $invQuery = Invoice::with(['items', 'customer', 'businessGstin'])
            ->where('business_id', $validated['business_id']);

        $noteQuery = CreditDebitNote::with(['originalInvoice.customer', 'businessGstin'])
            ->where('business_id', $validated['business_id']);

        if (!empty($validated['month'])) {
            $invQuery->whereMonth('invoice_date', $validated['month']);
            $noteQuery->whereMonth('note_date', $validated['month']);
        }
        if (!empty($validated['year'])) {
            $invQuery->whereYear('invoice_date', $validated['year']);
            $noteQuery->whereYear('note_date', $validated['year']);
        }

        $invoices = $invQuery->get();
        $notes = $noteQuery->get();

        // Exact BCMath accumulators
        $totTaxable = '0.00';
        $totCgst = '0.00';
        $totSgst = '0.00';
        $totIgst = '0.00';
        $totCess = '0.00';
        $totTax = '0.00';
        $totGrand = '0.00';

        $b2b = [];
        $b2cl = [];
        $b2cs = [];
        $exp = [];
        $nilExempt = [];
        $cdnr = [];
        $cdnur = [];
        $hsnMap = [];

        foreach ($invoices as $inv) {
            $taxable = (string) $inv->total_taxable_value;
            $cgst = (string) $inv->total_cgst;
            $sgst = (string) $inv->total_sgst;
            $igst = (string) $inv->total_igst;
            $cess = (string) ($inv->total_cess ?? '0.00');
            $tax = (string) $inv->total_tax_amount;
            $grand = (string) $inv->grand_total;

            $totTaxable = bcadd($totTaxable, $taxable, 2);
            $totCgst = bcadd($totCgst, $cgst, 2);
            $totSgst = bcadd($totSgst, $sgst, 2);
            $totIgst = bcadd($totIgst, $igst, 2);
            $totCess = bcadd($totCess, $cess, 2);
            $totTax = bcadd($totTax, $tax, 2);
            $totGrand = bcadd($totGrand, $grand, 2);

            $isB2b = !empty($inv->customer?->gstin);
            $isExport = $inv->invoice_type === 'export';
            $isInterstate = (bool) $inv->is_interstate;
            $grandVal = (float) $grand;

            $doc = [
                'invoice_number' => $inv->invoice_number,
                'invoice_date' => Carbon::parse($inv->invoice_date)->format('Y-m-d'),
                'customer_name' => $inv->customer?->name ?? 'Cash Customer',
                'customer_gstin' => $inv->customer?->gstin ?? null,
                'place_of_supply' => $inv->place_of_supply_state_code,
                'is_interstate' => $isInterstate,
                'reverse_charge' => (bool) $inv->reverse_charge,
                'taxable_value' => $taxable,
                'cgst_amount' => $cgst,
                'sgst_amount' => $sgst,
                'igst_amount' => $igst,
                'cess_amount' => $cess,
                'total_tax' => $tax,
                'grand_total' => $grand,
            ];

            if ($isExport) {
                // Table 6A: Exports
                $exp[] = $doc;
            } elseif ($isB2b) {
                // Table 4: B2B Invoices to Registered Persons
                $b2b[] = $doc;
            } elseif ($isInterstate && $grandVal > 250000) {
                // Table 5: B2CL Large Invoices (Inter-State > 2.5 Lakhs)
                $b2cl[] = $doc;
            } elseif ($inv->invoice_type === 'bill_of_supply' || (bccomp($tax, '0.00', 2) === 0)) {
                // Table 8: Nil-rated, Exempted and Non-GST
                $nilExempt[] = $doc;
            } else {
                // Table 7: B2CS Small Invoices
                $b2cs[] = $doc;
            }

            // HSN Summary aggregation (Table 12)
            foreach ($inv->items as $item) {
                $code = $item->hsn_sac;
                if (!isset($hsnMap[$code])) {
                    $hsnMap[$code] = [
                        'hsn_sac' => $code,
                        'description' => $item->item_name,
                        'uqc' => $item->unit ?? 'NOS',
                        'total_quantity' => '0.00',
                        'total_taxable_value' => '0.00',
                        'cgst_amount' => '0.00',
                        'sgst_amount' => '0.00',
                        'igst_amount' => '0.00',
                        'cess_amount' => '0.00',
                        'total_tax' => '0.00',
                    ];
                }
                $hsnMap[$code]['total_quantity'] = bcadd($hsnMap[$code]['total_quantity'], (string) $item->quantity, 2);
                $hsnMap[$code]['total_taxable_value'] = bcadd($hsnMap[$code]['total_taxable_value'], (string) $item->taxable_value, 2);
                $hsnMap[$code]['cgst_amount'] = bcadd($hsnMap[$code]['cgst_amount'], (string) $item->cgst_amount, 2);
                $hsnMap[$code]['sgst_amount'] = bcadd($hsnMap[$code]['sgst_amount'], (string) $item->sgst_amount, 2);
                $hsnMap[$code]['igst_amount'] = bcadd($hsnMap[$code]['igst_amount'], (string) $item->igst_amount, 2);
                $hsnMap[$code]['cess_amount'] = bcadd($hsnMap[$code]['cess_amount'], (string) ($item->cess_amount ?? '0.00'), 2);
                
                $itemTax = bcadd(bcadd((string) $item->cgst_amount, (string) $item->sgst_amount, 2), (string) $item->igst_amount, 2);
                $hsnMap[$code]['total_tax'] = bcadd($hsnMap[$code]['total_tax'], $itemTax, 2);
            }
        }

        // Process Credit / Debit Notes (Table 9B: CDNR & CDNUR)
        foreach ($notes as $note) {
            $isBuyerRegistered = !empty($note->originalInvoice?->customer?->gstin);
            $noteDoc = [
                'note_number' => $note->note_number,
                'note_date' => Carbon::parse($note->note_date)->format('Y-m-d'),
                'note_type' => $note->note_type,
                'original_invoice_number' => $note->originalInvoice?->invoice_number,
                'original_invoice_date' => $note->originalInvoice?->invoice_date ? Carbon::parse($note->originalInvoice->invoice_date)->format('Y-m-d') : null,
                'customer_name' => $note->originalInvoice?->customer?->name ?? 'Cash Customer',
                'customer_gstin' => $note->originalInvoice?->customer?->gstin ?? null,
                'reason' => $note->reason,
                'taxable_value' => (string) $note->taxable_value,
                'cgst_amount' => (string) $note->cgst_amount,
                'sgst_amount' => (string) $note->sgst_amount,
                'igst_amount' => (string) $note->igst_amount,
                'total_amount' => (string) $note->total_amount,
            ];

            if ($isBuyerRegistered) {
                $cdnr[] = $noteDoc;
            } else {
                $cdnur[] = $noteDoc;
            }
        }

        // Table 13: Document summary
        $firstInv = $invoices->first();
        $lastInv = $invoices->last();
        $docIssue = [
            'doc_type' => 'Invoices for outward supply',
            'from_serial' => $firstInv?->invoice_number ?? 'N/A',
            'to_serial' => $lastInv?->invoice_number ?? 'N/A',
            'total_issued' => count($invoices),
            'cancelled' => 0,
            'net_issued' => count($invoices),
        ];

        return response()->json([
            'statutory_return' => 'GSTR-1',
            'meta' => [
                'business_id' => $validated['business_id'],
                'return_period' => !empty($validated['month']) && !empty($validated['year']) 
                    ? str_pad((string) $validated['month'], 2, '0', STR_PAD_LEFT) . (string) $validated['year']
                    : 'ALL',
                'total_invoices' => count($invoices),
                'b2b_count' => count($b2b),
                'b2cl_count' => count($b2cl),
                'b2cs_count' => count($b2cs),
                'cdnr_count' => count($cdnr),
                'cdnur_count' => count($cdnur),
                'exp_count' => count($exp),
            ],
            'totals' => [
                'total_taxable_value' => $totTaxable,
                'total_cgst' => $totCgst,
                'total_sgst' => $totSgst,
                'total_igst' => $totIgst,
                'total_cess' => $totCess,
                'total_tax_amount' => $totTax,
                'grand_total' => $totGrand,
            ],
            'tables' => [
                'b2b' => $b2b,
                'b2cl' => $b2cl,
                'b2cs' => $b2cs,
                'cdnr' => $cdnr,
                'cdnur' => $cdnur,
                'exp' => $exp,
                'nil_exempt' => $nilExempt,
                'hsn_summary' => array_values($hsnMap),
                'doc_issued' => [$docIssue],
            ],
        ]);
    }

    /**
     * Statutory GSTR-3B Monthly Return Summary.
     * Table 3.1: Tax on outward and reverse charge inward supplies
     * Table 3.2: Inter-state supplies to unregistered persons
     * Table 4: Eligible Input Tax Credit (ITC)
     * Table 5: Values of exempt, nil-rated and non-GST inward supplies
     */
    public function gstr3b(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'month' => 'nullable|integer|between:1,12',
            'year' => 'nullable|integer|between:2020,2035',
        ]);

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

        $invQuery = Invoice::where('business_id', $validated['business_id']);

        if (!empty($validated['month'])) {
            $invQuery->whereMonth('invoice_date', $validated['month']);
        }
        if (!empty($validated['year'])) {
            $invQuery->whereYear('invoice_date', $validated['year']);
        }

        $invoices = $invQuery->get();

        // 3.1(a) Outward Taxable Supplies (other than zero rated, nil and exempted)
        $taxableSupplies = [
            'taxable_value' => '0.00',
            'igst' => '0.00',
            'cgst' => '0.00',
            'sgst' => '0.00',
            'cess' => '0.00',
        ];

        // 3.1(b) Outward Taxable Supplies (zero rated)
        $zeroRatedSupplies = [
            'taxable_value' => '0.00',
            'igst' => '0.00',
            'cess' => '0.00',
        ];

        // 3.1(c) Other Outward Supplies (Nil rated, exempted)
        $exemptSupplies = [
            'taxable_value' => '0.00',
        ];

        // 3.1(d) Inward Supplies liable to Reverse Charge
        $rcmSupplies = [
            'taxable_value' => '0.00',
            'igst' => '0.00',
            'cgst' => '0.00',
            'sgst' => '0.00',
            'cess' => '0.00',
        ];

        foreach ($invoices as $inv) {
            $taxable = (string) $inv->total_taxable_value;
            $cgst = (string) $inv->total_cgst;
            $sgst = (string) $inv->total_sgst;
            $igst = (string) $inv->total_igst;
            $cess = (string) ($inv->total_cess ?? '0.00');

            if ($inv->reverse_charge) {
                $rcmSupplies['taxable_value'] = bcadd($rcmSupplies['taxable_value'], $taxable, 2);
                $rcmSupplies['igst'] = bcadd($rcmSupplies['igst'], $igst, 2);
                $rcmSupplies['cgst'] = bcadd($rcmSupplies['cgst'], $cgst, 2);
                $rcmSupplies['sgst'] = bcadd($rcmSupplies['sgst'], $sgst, 2);
                $rcmSupplies['cess'] = bcadd($rcmSupplies['cess'], $cess, 2);
            } elseif ($inv->invoice_type === 'export') {
                $zeroRatedSupplies['taxable_value'] = bcadd($zeroRatedSupplies['taxable_value'], $taxable, 2);
                $zeroRatedSupplies['igst'] = bcadd($zeroRatedSupplies['igst'], $igst, 2);
                $zeroRatedSupplies['cess'] = bcadd($zeroRatedSupplies['cess'], $cess, 2);
            } elseif ($inv->invoice_type === 'bill_of_supply' || (bccomp((string) $inv->total_tax_amount, '0.00', 2) === 0)) {
                $exemptSupplies['taxable_value'] = bcadd($exemptSupplies['taxable_value'], $taxable, 2);
            } else {
                $taxableSupplies['taxable_value'] = bcadd($taxableSupplies['taxable_value'], $taxable, 2);
                $taxableSupplies['igst'] = bcadd($taxableSupplies['igst'], $igst, 2);
                $taxableSupplies['cgst'] = bcadd($taxableSupplies['cgst'], $cgst, 2);
                $taxableSupplies['sgst'] = bcadd($taxableSupplies['sgst'], $sgst, 2);
                $taxableSupplies['cess'] = bcadd($taxableSupplies['cess'], $cess, 2);
            }
        }

        return response()->json([
            'statutory_return' => 'GSTR-3B',
            'meta' => [
                'business_id' => $validated['business_id'],
                'return_period' => !empty($validated['month']) && !empty($validated['year'])
                    ? str_pad((string) $validated['month'], 2, '0', STR_PAD_LEFT) . (string) $validated['year']
                    : 'ALL',
                'invoice_count' => count($invoices),
            ],
            'table_3_1' => [
                '3_1_a_outward_taxable' => $taxableSupplies,
                '3_1_b_outward_zero_rated' => $zeroRatedSupplies,
                '3_1_c_other_outward_exempt' => $exemptSupplies,
                '3_1_d_inward_reverse_charge' => $rcmSupplies,
                '3_1_e_non_gst_outward' => ['taxable_value' => '0.00'],
            ],
            'table_4_itc' => [
                'itc_available' => [
                    'import_of_goods' => ['igst' => '0.00', 'cess' => '0.00'],
                    'import_of_services' => ['igst' => '0.00', 'cess' => '0.00'],
                    'inward_reverse_charge' => $rcmSupplies,
                    'inward_isd' => ['igst' => '0.00', 'cgst' => '0.00', 'sgst' => '0.00', 'cess' => '0.00'],
                    'all_other_itc' => ['igst' => '0.00', 'cgst' => '0.00', 'sgst' => '0.00', 'cess' => '0.00'],
                ],
                'itc_reversed' => [
                    'rule_38_42_43' => ['igst' => '0.00', 'cgst' => '0.00', 'sgst' => '0.00', 'cess' => '0.00'],
                    'others' => ['igst' => '0.00', 'cgst' => '0.00', 'sgst' => '0.00', 'cess' => '0.00'],
                ],
            ],
        ]);
    }
}
