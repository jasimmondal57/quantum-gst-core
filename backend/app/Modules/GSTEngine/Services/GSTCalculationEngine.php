<?php

namespace App\Modules\GSTEngine\Services;

class GSTCalculationEngine
{
    /**
     * Union Territories without legislature that levy UTGST instead of SGST.
     * 04 - Chandigarh
     * 26 - Dadra and Nagar Haveli and Daman and Diu
     * 31 - Lakshadweep
     * 35 - Andaman and Nicobar Islands
     * 38 - Ladakh
     */
    public const UTGST_STATE_CODES = ['04', '26', '31', '35', '38'];

    /**
     * Supply classifications as per Indian statutory GST provisions.
     */
    public const SUPPLY_REGULAR = 'REGULAR';
    public const SUPPLY_EXPORT_WITH_PAYMENT = 'EXPORT_WITH_PAYMENT';
    public const SUPPLY_EXPORT_WITHOUT_PAYMENT = 'EXPORT_WITHOUT_PAYMENT';
    public const SUPPLY_SEZ_WITH_PAYMENT = 'SEZ_WITH_PAYMENT';
    public const SUPPLY_SEZ_WITHOUT_PAYMENT = 'SEZ_WITHOUT_PAYMENT';
    public const SUPPLY_DEEMED_EXPORT = 'DEEMED_EXPORT';
    public const SUPPLY_NIL_RATED = 'NIL_RATED';
    public const SUPPLY_EXEMPT = 'EXEMPT';
    public const SUPPLY_NON_GST = 'NON_GST';

    /**
     * Determine if a transaction is inter-state or intra-state.
     * Special supply types (Exports, SEZ) are statutorily deemed inter-state under Section 7 of IGST Act.
     */
    public function isInterstate(
        string $originStateCode,
        string $placeOfSupplyStateCode,
        string $supplyType = self::SUPPLY_REGULAR
    ): bool {
        // Special deemed inter-state supplies under Section 7(5) of the IGST Act
        if (in_array($supplyType, [
            self::SUPPLY_EXPORT_WITH_PAYMENT,
            self::SUPPLY_EXPORT_WITHOUT_PAYMENT,
            self::SUPPLY_SEZ_WITH_PAYMENT,
            self::SUPPLY_SEZ_WITHOUT_PAYMENT,
        ], true)) {
            return true;
        }

        $origin = str_pad(trim($originStateCode), 2, '0', STR_PAD_LEFT);
        $pos = str_pad(trim($placeOfSupplyStateCode), 2, '0', STR_PAD_LEFT);

        return $origin !== $pos;
    }

    /**
     * Determine if an intra-state transaction qualifies for UTGST instead of SGST.
     */
    public function isUtgst(string $stateCode): bool
    {
        $code = str_pad(trim($stateCode), 2, '0', STR_PAD_LEFT);
        return in_array($code, self::UTGST_STATE_CODES, true);
    }

    /**
     * Calculate statutory GST breakdown for a single invoice item.
     * Guaranteed zero-floating precision using pure BCMath string arithmetic.
     *
     * @param string $taxableValue Taxable base value (e.g. "1000.00")
     * @param string $gstRate Applicable GST rate percentage (e.g. "18.00", "5.00", "12.00", "28.00")
     * @param bool $isInterstate True for IGST, False for CGST + SGST/UTGST
     * @param bool $isUtgst True if intra-state supply in a Union Territory without legislature
     * @param string $cessRate Ad-valorem Cess percentage (e.g. "12.00")
     * @param string $cessSpecific Fixed specific cess amount (e.g. "400.00")
     * @param string $supplyType Supply classification code
     * @param bool $isReverseCharge True if recipient is liable to pay tax under RCM (Sec 9(3)/9(4))
     * @return array
     */
    public function calculateItemTaxes(
        string $taxableValue,
        string $gstRate,
        bool $isInterstate,
        bool $isUtgst = false,
        string $cessRate = '0',
        string $cessSpecific = '0',
        string $supplyType = self::SUPPLY_REGULAR,
        bool $isReverseCharge = false
    ): array {
        $taxable = bcdiv($taxableValue, '1', 4);
        $rate = bcdiv($gstRate, '1', 4);
        $cessPct = bcdiv($cessRate, '1', 4);
        $specificCess = bcdiv($cessSpecific, '1', 4);

        $cgstRate = '0.0000';
        $cgstAmount = '0.0000';
        $sgstRate = '0.0000';
        $sgstAmount = '0.0000';
        $utgstRate = '0.0000';
        $utgstAmount = '0.0000';
        $igstRate = '0.0000';
        $igstAmount = '0.0000';
        $totalTax = '0.0000';

        // Check if zero-rated without payment, nil-rated, exempt, or non-gst
        $isZeroTax = in_array($supplyType, [
            self::SUPPLY_EXPORT_WITHOUT_PAYMENT,
            self::SUPPLY_SEZ_WITHOUT_PAYMENT,
            self::SUPPLY_NIL_RATED,
            self::SUPPLY_EXEMPT,
            self::SUPPLY_NON_GST,
        ], true);

        if (!$isZeroTax && bccomp($rate, '0', 4) > 0) {
            if ($isInterstate) {
                $igstRate = $rate;
                $igstAmount = bcdiv(bcmul($taxable, $igstRate, 4), '100', 4);
                $totalTax = $igstAmount;
            } else {
                // Intra-state splits equally between CGST and SGST/UTGST
                $halfRate = bcdiv($rate, '2', 4);
                $cgstRate = $halfRate;
                $cgstAmount = bcdiv(bcmul($taxable, $cgstRate, 4), '100', 4);

                if ($isUtgst) {
                    $utgstRate = $halfRate;
                    $utgstAmount = bcdiv(bcmul($taxable, $utgstRate, 4), '100', 4);
                    $totalTax = bcadd($cgstAmount, $utgstAmount, 4);
                } else {
                    $sgstRate = $halfRate;
                    $sgstAmount = bcdiv(bcmul($taxable, $sgstRate, 4), '100', 4);
                    $totalTax = bcadd($cgstAmount, $sgstAmount, 4);
                }
            }
        }

        // Cess calculation: Ad-valorem + Specific Cess
        $adValoremCess = '0.0000';
        if (!$isZeroTax && bccomp($cessPct, '0', 4) > 0) {
            $adValoremCess = bcdiv(bcmul($taxable, $cessPct, 4), '100', 4);
        }
        $cessAmount = bcadd($adValoremCess, $specificCess, 4);
        $totalTax = bcadd($totalTax, $cessAmount, 4);

        $itemTotal = bcadd($taxable, $totalTax, 4);

        return [
            'taxable_value' => bcdiv($taxable, '1', 2),
            'is_interstate' => $isInterstate,
            'is_utgst' => $isUtgst,
            'supply_type' => $supplyType,
            'is_reverse_charge' => $isReverseCharge,
            'cgst_rate' => bcdiv($cgstRate, '1', 2),
            'cgst_amount' => bcdiv($cgstAmount, '1', 2),
            'sgst_rate' => bcdiv($sgstRate, '1', 2),
            'sgst_amount' => bcdiv($sgstAmount, '1', 2),
            'utgst_rate' => bcdiv($utgstRate, '1', 2),
            'utgst_amount' => bcdiv($utgstAmount, '1', 2),
            'igst_rate' => bcdiv($igstRate, '1', 2),
            'igst_amount' => bcdiv($igstAmount, '1', 2),
            'cess_rate' => bcdiv($cessPct, '1', 2),
            'cess_amount' => bcdiv($cessAmount, '1', 2),
            'total_tax' => bcdiv($totalTax, '1', 2),
            'item_total' => bcdiv($itemTotal, '1', 2),
        ];
    }

    /**
     * Extract taxable value if the product price is tax-inclusive.
     * Taxable = (Gross * 100) / (100 + Rate + CessRate)
     */
    public function extractTaxableFromInclusive(
        string $grossAmount,
        string $totalGstRate,
        string $cessRate = '0',
        string $cessSpecific = '0'
    ): string {
        $gross = bcdiv($grossAmount, '1', 4);
        $specificCess = bcdiv($cessSpecific, '1', 4);

        // Deduct specific cess from gross before applying rate formula
        $grossLessSpecific = bcsub($gross, $specificCess, 4);
        if (bccomp($grossLessSpecific, '0', 4) < 0) {
            $grossLessSpecific = '0.0000';
        }

        $taxPct = bcdiv($totalGstRate, '1', 4);
        $cessPct = bcdiv($cessRate, '1', 4);
        $totalRate = bcadd($taxPct, $cessPct, 4);
        $multiplier = bcadd('100', $totalRate, 4);

        return bcdiv(bcmul($grossLessSpecific, '100', 6), $multiplier, 2);
    }

    /**
     * Calculate financial totals for an entire document (e.g., Invoice / Bill / Note).
     * Guaranteed exact decimal output matching database schema.
     */
    public function calculateDocumentTotals(array $calculatedItems): array
    {
        $totalTaxable = '0.00';
        $totalCgst = '0.00';
        $totalSgst = '0.00';
        $totalUtgst = '0.00';
        $totalIgst = '0.00';
        $totalCess = '0.00';
        $totalTax = '0.00';
        $subTotal = '0.00';

        foreach ($calculatedItems as $item) {
            $totalTaxable = bcadd($totalTaxable, (string) ($item['taxable_value'] ?? '0.00'), 2);
            $totalCgst = bcadd($totalCgst, (string) ($item['cgst_amount'] ?? '0.00'), 2);
            $totalSgst = bcadd($totalSgst, (string) ($item['sgst_amount'] ?? '0.00'), 2);
            $totalUtgst = bcadd($totalUtgst, (string) ($item['utgst_amount'] ?? '0.00'), 2);
            $totalIgst = bcadd($totalIgst, (string) ($item['igst_amount'] ?? '0.00'), 2);
            $totalCess = bcadd($totalCess, (string) ($item['cess_amount'] ?? '0.00'), 2);
            $totalTax = bcadd($totalTax, (string) ($item['total_tax'] ?? '0.00'), 2);
            $subTotal = bcadd($subTotal, (string) ($item['item_total'] ?? '0.00'), 2);
        }

        // Standard Indian statutory invoice rounding to nearest whole rupee
        $wholeRupee = round((float) $subTotal);
        $grandTotal = number_format($wholeRupee, 2, '.', '');
        $roundOff = bcsub($grandTotal, $subTotal, 2);

        return [
            'total_taxable_value' => $totalTaxable,
            'total_cgst' => $totalCgst,
            'total_sgst' => $totalSgst,
            'total_utgst' => $totalUtgst,
            'total_igst' => $totalIgst,
            'total_cess' => $totalCess,
            'total_tax_amount' => $totalTax,
            'round_off' => $roundOff,
            'grand_total' => $grandTotal,
        ];
    }
}
