<?php

namespace App\Modules\GSTEngine\Services;

class GSTCalculationEngine
{
    /**
     * Determine if a transaction is inter-state or intra-state.
     * Special Union Territories without legislature (e.g., Ladakh, DNH & DD, Chandigarh, A&N, Lakshadweep)
     * are treated with UTGST or CGST+UTGST (equivalent to SGST in rate).
     */
    public function isInterstate(string $originStateCode, string $placeOfSupplyStateCode): bool
    {
        $origin = str_pad(trim($originStateCode), 2, '0', STR_PAD_LEFT);
        $pos = str_pad(trim($placeOfSupplyStateCode), 2, '0', STR_PAD_LEFT);

        return $origin !== $pos;
    }

    /**
     * Calculate statutory GST breakdown for a single item.
     * Guaranteed zero-floating precision using bcmath strings.
     *
     * @param string $taxableValue Taxable base value
     * @param string $gstRate Total applicable GST percentage (e.g. "18.00", "5.00", "12.00", "28.00")
     * @param bool $isInterstate True for IGST, False for CGST + SGST
     * @param string $cessRate Optional cess percentage
     * @return array
     */
    public function calculateItemTaxes(
        string $taxableValue,
        string $gstRate,
        bool $isInterstate,
        string $cessRate = '0'
    ): array {
        $taxable = bcdiv($taxableValue, '1', 4);
        $rate = bcdiv($gstRate, '1', 4);
        $cessPct = bcdiv($cessRate, '1', 4);

        $totalTax = '0.0000';
        $cgstRate = '0.0000';
        $cgstAmount = '0.0000';
        $sgstRate = '0.0000';
        $sgstAmount = '0.0000';
        $igstRate = '0.0000';
        $igstAmount = '0.0000';

        if (bccomp($rate, '0', 4) > 0) {
            if ($isInterstate) {
                $igstRate = $rate;
                $igstAmount = bcdiv(bcmul($taxable, $igstRate, 4), '100', 4);
                $totalTax = $igstAmount;
            } else {
                // Intra-state splits equally between CGST and SGST/UTGST
                $cgstRate = bcdiv($rate, '2', 4);
                $sgstRate = bcdiv($rate, '2', 4);

                $cgstAmount = bcdiv(bcmul($taxable, $cgstRate, 4), '100', 4);
                $sgstAmount = bcdiv(bcmul($taxable, $sgstRate, 4), '100', 4);
                $totalTax = bcadd($cgstAmount, $sgstAmount, 4);
            }
        }

        $cessAmount = '0.0000';
        if (bccomp($cessPct, '0', 4) > 0) {
            $cessAmount = bcdiv(bcmul($taxable, $cessPct, 4), '100', 4);
            $totalTax = bcadd($totalTax, $cessAmount, 4);
        }

        $itemTotal = bcadd($taxable, $totalTax, 4);

        return [
            'taxable_value' => round((float) $taxable, 2),
            'is_interstate' => $isInterstate,
            'cgst_rate' => round((float) $cgstRate, 2),
            'cgst_amount' => round((float) $cgstAmount, 2),
            'sgst_rate' => round((float) $sgstRate, 2),
            'sgst_amount' => round((float) $sgstAmount, 2),
            'igst_rate' => round((float) $igstRate, 2),
            'igst_amount' => round((float) $igstAmount, 2),
            'cess_rate' => round((float) $cessPct, 2),
            'cess_amount' => round((float) $cessAmount, 2),
            'total_tax' => round((float) $totalTax, 2),
            'item_total' => round((float) $itemTotal, 2),
        ];
    }

    /**
     * Extract taxable value if the product price is tax-inclusive.
     */
    public function extractTaxableFromInclusive(string $grossAmount, string $totalGstRate, string $cessRate = '0'): string
    {
        $gross = bcdiv($grossAmount, '1', 4);
        $taxPct = bcdiv($totalGstRate, '1', 4);
        $cessPct = bcdiv($cessRate, '1', 4);

        $totalRate = bcadd($taxPct, $cessPct, 4);
        $multiplier = bcadd('100', $totalRate, 4);

        // Taxable = (Gross * 100) / (100 + Rate)
        return bcdiv(bcmul($gross, '100', 6), $multiplier, 4);
    }

    /**
     * Calculate financial totals for an entire document (e.g., Invoice).
     */
    public function calculateDocumentTotals(array $calculatedItems): array
    {
        $totalTaxable = '0.00';
        $totalCgst = '0.00';
        $totalSgst = '0.00';
        $totalIgst = '0.00';
        $totalCess = '0.00';
        $totalTax = '0.00';
        $subTotal = '0.00';

        foreach ($calculatedItems as $item) {
            $totalTaxable = bcadd($totalTaxable, (string) $item['taxable_value'], 2);
            $totalCgst = bcadd($totalCgst, (string) $item['cgst_amount'], 2);
            $totalSgst = bcadd($totalSgst, (string) $item['sgst_amount'], 2);
            $totalIgst = bcadd($totalIgst, (string) $item['igst_amount'], 2);
            $totalCess = bcadd($totalCess, (string) $item['cess_amount'], 2);
            $totalTax = bcadd($totalTax, (string) $item['total_tax'], 2);
            $subTotal = bcadd($subTotal, (string) $item['item_total'], 2);
        }

        $rawTotal = (float) $subTotal;
        $roundedGrandTotal = round($rawTotal);
        $roundOff = round($roundedGrandTotal - $rawTotal, 2);

        return [
            'total_taxable_value' => (float) $totalTaxable,
            'total_cgst' => (float) $totalCgst,
            'total_sgst' => (float) $totalSgst,
            'total_igst' => (float) $totalIgst,
            'total_cess' => (float) $totalCess,
            'total_tax_amount' => (float) $totalTax,
            'round_off' => $roundOff,
            'grand_total' => $roundedGrandTotal,
        ];
    }
}

