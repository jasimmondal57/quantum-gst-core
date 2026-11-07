<?php

namespace App\Modules\GSTEngine\Services;

use App\Models\CreditDebitNote;
use App\Models\Invoice;
use App\Models\PurchaseBill;
use Carbon\Carbon;

class Gstr9Generator
{
    /**
     * Generate official GSTR-9 Annual Return compilation for a financial year.
     * FY format: '2026-27'
     */
    public function generate(string $businessId, string $financialYear): array
    {
        $parts = explode('-', $financialYear);
        $startYear = (int) $parts[0];
        $startDate = "{$startYear}-04-01";
        $endDate = ($startYear + 1) . "-03-31";

        // 1. Fetch all Outward Invoices during the FY
        $invoices = Invoice::where('business_id', $businessId)
            ->whereBetween('invoice_date', [$startDate, $endDate])
            ->whereIn('status', ['finalized', 'paid', 'partially_paid'])
            ->with(['customer'])
            ->get();

        // 2. Fetch all Credit/Debit Notes during the FY
        $notes = CreditDebitNote::where('business_id', $businessId)
            ->whereBetween('note_date', [$startDate, $endDate])
            ->where('status', 'active')
            ->get();

        // 3. Fetch all Inward Purchase Bills during the FY
        $purchases = PurchaseBill::where('business_id', $businessId)
            ->whereBetween('bill_date', [$startDate, $endDate])
            ->whereIn('status', ['received', 'paid', 'partially_paid'])
            ->get();

        // Table 4: Taxable Outward Supplies
        $t4_b2c = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t4_b2b = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t4_exp_wp = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t4_sez_wp = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];

        // Table 5: Outward Supplies without tax
        $t5_exp_wop = '0.00';
        $t5_sez_wop = '0.00';
        $t5_nil_exempt = '0.00';
        $t5_non_gst = '0.00';

        foreach ($invoices as $inv) {
            $txval = (string) $inv->total_taxable_value;
            $cgst = (string) $inv->total_cgst;
            $sgst = (string) $inv->total_sgst;
            $igst = (string) $inv->total_igst;
            $cess = (string) ($inv->total_cess ?? '0.00');

            $custType = $inv->customer?->customer_type ?? 'b2c';

            if ($inv->invoice_type === 'export') {
                if (bccomp($igst, '0.00', 2) > 0) {
                    $t4_exp_wp['txval'] = bcadd($t4_exp_wp['txval'], $txval, 2);
                    $t4_exp_wp['iamt'] = bcadd($t4_exp_wp['iamt'], $igst, 2);
                } else {
                    $t5_exp_wop = bcadd($t5_exp_wop, $txval, 2);
                }
            } elseif ($custType === 'sez') {
                if (bccomp($igst, '0.00', 2) > 0) {
                    $t4_sez_wp['txval'] = bcadd($t4_sez_wp['txval'], $txval, 2);
                    $t4_sez_wp['iamt'] = bcadd($t4_sez_wp['iamt'], $igst, 2);
                } else {
                    $t5_sez_wop = bcadd($t5_sez_wop, $txval, 2);
                }
            } elseif ($custType === 'b2b') {
                $t4_b2b['txval'] = bcadd($t4_b2b['txval'], $txval, 2);
                $t4_b2b['camt'] = bcadd($t4_b2b['camt'], $cgst, 2);
                $t4_b2b['samt'] = bcadd($t4_b2b['samt'], $sgst, 2);
                $t4_b2b['iamt'] = bcadd($t4_b2b['iamt'], $igst, 2);
                $t4_b2b['csamt'] = bcadd($t4_b2b['csamt'], $cess, 2);
            } else {
                $t4_b2c['txval'] = bcadd($t4_b2c['txval'], $txval, 2);
                $t4_b2c['camt'] = bcadd($t4_b2c['camt'], $cgst, 2);
                $t4_b2c['samt'] = bcadd($t4_b2c['samt'], $sgst, 2);
                $t4_b2c['iamt'] = bcadd($t4_b2c['iamt'], $igst, 2);
                $t4_b2c['csamt'] = bcadd($t4_b2c['csamt'], $cess, 2);
            }
        }

        // Adjust Table 4 for Credit & Debit Notes
        $crn_adj = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00'];
        $drn_adj = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00'];

        foreach ($notes as $n) {
            $t = $n->note_type === 'credit_note' ? $crn_adj : $drn_adj;
            $t['txval'] = bcadd($t['txval'], (string) $n->taxable_value, 2);
            $t['camt'] = bcadd($t['camt'], (string) $n->cgst_amount, 2);
            $t['samt'] = bcadd($t['samt'], (string) $n->sgst_amount, 2);
            $t['iamt'] = bcadd($t['iamt'], (string) $n->igst_amount, 2);
            if ($n->note_type === 'credit_note') {
                $crn_adj = $t;
            } else {
                $drn_adj = $t;
            }
        }

        // Table 6: Inward ITC Availed
        $t6_inputs = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t6_capital = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t6_services = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];
        $t7_ineligible = ['txval' => '0.00', 'iamt' => '0.00', 'camt' => '0.00', 'samt' => '0.00', 'csamt' => '0.00'];

        foreach ($purchases as $p) {
            $txval = (string) $p->total_taxable_value;
            $cgst = (string) $p->total_cgst;
            $sgst = (string) $p->total_sgst;
            $igst = (string) $p->total_igst;
            $cess = (string) ($p->total_cess ?? '0.00');

            if ($p->itc_eligibility === 'ineligible') {
                $t7_ineligible['txval'] = bcadd($t7_ineligible['txval'], $txval, 2);
                $t7_ineligible['camt'] = bcadd($t7_ineligible['camt'], $cgst, 2);
                $t7_ineligible['samt'] = bcadd($t7_ineligible['samt'], $sgst, 2);
                $t7_ineligible['iamt'] = bcadd($t7_ineligible['iamt'], $igst, 2);
            } elseif ($p->itc_eligibility === 'capital_goods') {
                $t6_capital['txval'] = bcadd($t6_capital['txval'], $txval, 2);
                $t6_capital['camt'] = bcadd($t6_capital['camt'], $cgst, 2);
                $t6_capital['samt'] = bcadd($t6_capital['samt'], $sgst, 2);
                $t6_capital['iamt'] = bcadd($t6_capital['iamt'], $igst, 2);
            } elseif ($p->itc_eligibility === 'input_services') {
                $t6_services['txval'] = bcadd($t6_services['txval'], $txval, 2);
                $t6_services['camt'] = bcadd($t6_services['camt'], $cgst, 2);
                $t6_services['samt'] = bcadd($t6_services['samt'], $sgst, 2);
                $t6_services['iamt'] = bcadd($t6_services['iamt'], $igst, 2);
            } else {
                $t6_inputs['txval'] = bcadd($t6_inputs['txval'], $txval, 2);
                $t6_inputs['camt'] = bcadd($t6_inputs['camt'], $cgst, 2);
                $t6_inputs['samt'] = bcadd($t6_inputs['samt'], $sgst, 2);
                $t6_inputs['iamt'] = bcadd($t6_inputs['iamt'], $igst, 2);
                $t6_inputs['csamt'] = bcadd($t6_inputs['csamt'], $cess, 2);
            }
        }

        // Table 9: Tax Paid Summary
        $totalTaxPaid = [
            'iamt' => bcadd(bcadd($t4_b2c['iamt'], $t4_b2b['iamt'], 2), $t4_exp_wp['iamt'], 2),
            'camt' => bcadd($t4_b2c['camt'], $t4_b2b['camt'], 2),
            'samt' => bcadd($t4_b2c['samt'], $t4_b2b['samt'], 2),
            'csamt' => bcadd($t4_b2c['csamt'], $t4_b2b['csamt'], 2),
        ];

        return [
            'business_id' => $businessId,
            'financial_year' => $financialYear,
            'table_4_outward_taxable' => [
                'b2c' => $t4_b2c,
                'b2b' => $t4_b2b,
                'export_with_payment' => $t4_exp_wp,
                'sez_with_payment' => $t4_sez_wp,
                'credit_notes_adjustments' => $crn_adj,
                'debit_notes_adjustments' => $drn_adj,
            ],
            'table_5_outward_non_taxable' => [
                'export_without_payment_lut' => $t5_exp_wop,
                'sez_without_payment' => $t5_sez_wop,
                'nil_exempt' => $t5_nil_exempt,
                'non_gst' => $t5_non_gst,
            ],
            'table_6_itc_availed' => [
                'inputs' => $t6_inputs,
                'capital_goods' => $t6_capital,
                'input_services' => $t6_services,
            ],
            'table_7_itc_reversed_ineligible' => [
                'section_17_5_blocked' => $t7_ineligible,
            ],
            'table_9_tax_paid' => $totalTaxPaid,
        ];
    }
}
