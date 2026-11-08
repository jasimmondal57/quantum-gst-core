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

        $rawTaxable = bcdiv(bcmul($grossLessSpecific, '100', 6), $multiplier, 4);
        return $this->bcround2($rawTaxable);
    }

    /**
     * Half-up rounding to 2 decimal places using exact BCMath string arithmetic.
     */
    public function bcround2(string $number): string
    {
        $factor = '0.005';
        if (str_starts_with($number, '-')) {
            $abs = substr($number, 1);
            return '-' . bcdiv(bcadd($abs, $factor, 4), '1', 2);
        }
        return bcdiv(bcadd($number, $factor, 4), '1', 2);
    }

    /**
     * Apportion invoice-level discount across items proportionally based on their pre-discount base taxable value.
     * Complies with Section 15(3) of CGST Act.
     *
     * @param array $items Array of items, each with 'taxable_value' or ('quantity' * 'unit_price' - 'line_discount')
     * @param string $discountType 'percentage' | 'fixed'
     * @param string $discountValue Discount percentage or fixed amount
     * @return array Array of allocated discount amounts per item indexed by item key
     */
    public function allocateInvoiceDiscount(array $items, string $discountType = 'fixed', string $discountValue = '0'): array
    {
        $totalBaseTaxable = '0.00';
        foreach ($items as $item) {
            $taxable = (string) ($item['taxable_value'] ?? '0.00');
            $totalBaseTaxable = bcadd($totalBaseTaxable, $taxable, 4);
        }

        if (bccomp($totalBaseTaxable, '0', 4) <= 0) {
            return array_fill(0, count($items), '0.00');
        }

        $totalDiscountToAllocate = '0.00';
        if ($discountType === 'percentage') {
            $pct = bcdiv($discountValue, '1', 4);
            $totalDiscountToAllocate = bcdiv(bcmul($totalBaseTaxable, $pct, 4), '100', 2);
        } else {
            $totalDiscountToAllocate = bcdiv($discountValue, '1', 2);
        }

        if (bccomp($totalDiscountToAllocate, $totalBaseTaxable, 4) > 0) {
            $totalDiscountToAllocate = bcdiv($totalBaseTaxable, '1', 2);
        }

        $allocated = [];
        $runningSum = '0.00';
        $keys = array_keys($items);
        $lastIndex = count($keys) - 1;

        foreach ($keys as $idx => $key) {
            if ($idx === $lastIndex) {
                // Last item absorbs any fraction-of-a-paisa rounding residual
                $lineDiscount = bcsub($totalDiscountToAllocate, $runningSum, 2);
            } else {
                $itemTaxable = (string) ($items[$key]['taxable_value'] ?? '0.00');
                $ratio = bcdiv($itemTaxable, $totalBaseTaxable, 6);
                $lineDiscount = bcdiv(bcmul($totalDiscountToAllocate, $ratio, 4), '1', 2);
                $runningSum = bcadd($runningSum, $lineDiscount, 2);
            }
            $allocated[$key] = $lineDiscount;
        }

        return $allocated;
    }

    /**
     * Calculate financial totals for an entire document (e.g., Invoice / Bill / Note).
     * Guaranteed exact decimal output matching database schema.
     * When $isReverseCharge is true (Sec 9(3)/9(4)), tax amounts are retained for statutory reporting,
     * but customer payable grand_total strictly excludes reverse charge taxes.
     */
    public function calculateDocumentTotals(array $calculatedItems, bool $isReverseCharge = false): array
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
        }

        // Subtotal payable: under Reverse Charge, recipient pays tax directly to govt, so grand_total = taxable
        $subTotal = $isReverseCharge ? $totalTaxable : bcadd($totalTaxable, $totalTax, 2);

        // Standard Indian statutory invoice rounding to nearest whole rupee using exact BCMath
        $grandTotal = $this->bcroundRupee($subTotal);
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

    /**
     * Pure BCMath decimal-string rupee rounding (half-up) with zero floating-point arithmetic.
     */
    public function bcroundRupee(string $number): string
    {
        if (bccomp($number, '0.00', 4) === 0) {
            return '0.00';
        }

        $isNegative = str_starts_with($number, '-');
        $abs = $isNegative ? substr($number, 1) : $number;

        // Add 0.50 for half-up rounding, then truncate decimals
        $rounded = bcdiv(bcadd($abs, '0.50', 4), '1', 0);
        $result = $rounded . '.00';

        return $isNegative ? ('-' . $result) : $result;
    }
}
