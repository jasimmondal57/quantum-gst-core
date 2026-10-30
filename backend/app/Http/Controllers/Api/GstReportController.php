<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GstReportController extends Controller
{
    /**
     * GSTR-1 Outward Supplies Summary (B2B, B2CL, B2CS, and HSN Summary)
     */
    public function gstr1(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'month' => 'nullable|integer|between:1,12',
            'year' => 'nullable|integer|between:2020,2035',
        ]);

        $query = Invoice::with(['items', 'customer', 'businessGstin'])
            ->where('business_id', $validated['business_id']);

        if (!empty($validated['month'])) {
            $query->whereMonth('invoice_date', $validated['month']);
        }
        if (!empty($validated['year'])) {
            $query->whereYear('invoice_date', $validated['year']);
        }

        $invoices = $query->get();

        $b2b = [];
        $b2c = [];
        $hsnSummary = [];

        $totalTaxable = 0;
        $totalCgst = 0;
        $totalSgst = 0;
        $totalIgst = 0;
        $totalValue = 0;

        foreach ($invoices as $inv) {
            $totalTaxable += (float) $inv->total_taxable_value;
            $totalCgst += (float) $inv->total_cgst;
            $totalSgst += (float) $inv->total_sgst;
            $totalIgst += (float) $inv->total_igst;
            $totalValue += (float) $inv->grand_total;

            $isB2b = !empty($inv->customer?->gstin);

            $entry = [
                'invoice_number' => $inv->invoice_number,
                'invoice_date' => $inv->invoice_date,
                'customer_name' => $inv->customer?->name ?? 'Cash Customer',
                'customer_gstin' => $inv->customer?->gstin ?? 'N/A',
                'place_of_supply' => $inv->place_of_supply_state_code,
                'is_interstate' => $inv->is_interstate,
                'taxable_value' => (float) $inv->total_taxable_value,
                'cgst' => (float) $inv->total_cgst,
                'sgst' => (float) $inv->total_sgst,
                'igst' => (float) $inv->total_igst,
                'grand_total' => (float) $inv->grand_total,
            ];

            if ($isB2b) {
                $b2b[] = $entry;
            } else {
                $b2c[] = $entry;
            }

            foreach ($inv->items as $item) {
                $code = $item->hsn_sac;
                if (!isset($hsnSummary[$code])) {
                    $hsnSummary[$code] = [
                        'hsn_sac' => $code,
                        'description' => $item->item_name,
                        'total_quantity' => 0,
                        'taxable_value' => 0,
                        'total_tax' => 0,
                    ];
                }
                $hsnSummary[$code]['total_quantity'] += (float) $item->quantity;
                $hsnSummary[$code]['taxable_value'] += (float) $item->taxable_value;
                $hsnSummary[$code]['total_tax'] += (float) ($item->cgst_amount + $item->sgst_amount + $item->igst_amount);
            }
        }

        return response()->json([
            'meta' => [
                'business_id' => $validated['business_id'],
                'invoice_count' => count($invoices),
                'b2b_count' => count($b2b),
                'b2c_count' => count($b2c),
            ],
            'totals' => [
                'total_taxable_value' => round($totalTaxable, 2),
                'total_cgst' => round($totalCgst, 2),
                'total_sgst' => round($totalSgst, 2),
                'total_igst' => round($totalIgst, 2),
                'total_tax_amount' => round($totalCgst + $totalSgst + $totalIgst, 2),
                'grand_total' => round($totalValue, 2),
            ],
            'b2b_invoices' => $b2b,
            'b2c_invoices' => $b2c,
            'hsn_summary' => array_values($hsnSummary),
        ]);
    }
}
