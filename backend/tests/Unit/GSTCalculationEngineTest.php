<?php

namespace Tests\Unit;

use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use PHPUnit\Framework\TestCase;

class GSTCalculationEngineTest extends TestCase
{
    private GSTCalculationEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->engine = new GSTCalculationEngine();
    }

    public function test_intra_state_regular_split_cgst_and_sgst(): void
    {
        $result = $this->engine->calculateItemTaxes(
            taxableValue: '1000.00',
            gstRate: '18.00',
            isInterstate: false,
            isUtgst: false
        );

        $this->assertEquals('1000.00', $result['taxable_value']);
        $this->assertEquals('9.00', $result['cgst_rate']);
        $this->assertEquals('90.00', $result['cgst_amount']);
        $this->assertEquals('9.00', $result['sgst_rate']);
        $this->assertEquals('90.00', $result['sgst_amount']);
        $this->assertEquals('0.00', $result['utgst_amount']);
        $this->assertEquals('0.00', $result['igst_amount']);
        $this->assertEquals('180.00', $result['total_tax']);
        $this->assertEquals('1180.00', $result['item_total']);
    }

    public function test_intra_state_union_territory_utgst_resolution(): void
    {
        // Ladakh (38) intra-state supply
        $isUtgst = $this->engine->isUtgst('38');
        $this->assertTrue($isUtgst);

        $result = $this->engine->calculateItemTaxes(
            taxableValue: '50000.00',
            gstRate: '12.00',
            isInterstate: false,
            isUtgst: $isUtgst
        );

        $this->assertEquals('50000.00', $result['taxable_value']);
        $this->assertEquals('6.00', $result['cgst_rate']);
        $this->assertEquals('3000.00', $result['cgst_amount']);
        $this->assertEquals('0.00', $result['sgst_amount']);
        $this->assertEquals('6.00', $result['utgst_rate']);
        $this->assertEquals('3000.00', $result['utgst_amount']);
        $this->assertEquals('6000.00', $result['total_tax']);
        $this->assertEquals('56000.00', $result['item_total']);
    }

    public function test_inter_state_igst_calculation(): void
    {
        $result = $this->engine->calculateItemTaxes(
            taxableValue: '25000.00',
            gstRate: '28.00',
            isInterstate: true
        );

        $this->assertEquals('25000.00', $result['taxable_value']);
        $this->assertEquals('0.00', $result['cgst_amount']);
        $this->assertEquals('0.00', $result['sgst_amount']);
        $this->assertEquals('28.00', $result['igst_rate']);
        $this->assertEquals('7000.00', $result['igst_amount']);
        $this->assertEquals('7000.00', $result['total_tax']);
        $this->assertEquals('32000.00', $result['item_total']);
    }

    public function test_ad_valorem_and_specific_cess_combination(): void
    {
        // Aerated water or motor vehicle with 28% GST + 12% Cess + 150 Specific Cess
        $result = $this->engine->calculateItemTaxes(
            taxableValue: '10000.00',
            gstRate: '28.00',
            isInterstate: true,
            isUtgst: false,
            cessRate: '12.00',
            cessSpecific: '150.00'
        );

        $this->assertEquals('2800.00', $result['igst_amount']);
        // 12% of 10,000 = 1200 + 150 = 1350.00
        $this->assertEquals('1350.00', $result['cess_amount']);
        $this->assertEquals('4150.00', $result['total_tax']);
        $this->assertEquals('14150.00', $result['item_total']);
    }

    public function test_zero_rated_export_without_payment_lut(): void
    {
        $result = $this->engine->calculateItemTaxes(
            taxableValue: '200000.00',
            gstRate: '18.00',
            isInterstate: true,
            isUtgst: false,
            cessRate: '0',
            cessSpecific: '0',
            supplyType: GSTCalculationEngine::SUPPLY_EXPORT_WITHOUT_PAYMENT
        );

        $this->assertEquals('200000.00', $result['taxable_value']);
        $this->assertEquals('0.00', $result['igst_amount']);
        $this->assertEquals('0.00', $result['total_tax']);
        $this->assertEquals('200000.00', $result['item_total']);
    }

    public function test_extract_taxable_from_inclusive_price(): void
    {
        // Item gross = 118.00, GST rate = 18% -> Taxable should be 100.00
        $taxable = $this->engine->extractTaxableFromInclusive(
            grossAmount: '118.00',
            totalGstRate: '18.00'
        );

        $this->assertEquals('100.00', $taxable);
    }

    public function test_tax_inclusive_price_with_ad_valorem_cess(): void
    {
        // Motor vehicle / luxury goods: ₹ 140.00 inclusive of 28% GST + 12% Cess (Total tax = 40%)
        // Taxable base should be 140 / 1.40 = 100.00
        $taxable = $this->engine->extractTaxableFromInclusive(
            grossAmount: '140.00',
            totalGstRate: '28.00',
            cessRate: '12.00'
        );

        $this->assertEquals('100.00', $taxable);

        $taxes = $this->engine->calculateItemTaxes(
            taxableValue: $taxable,
            gstRate: '28.00',
            isInterstate: true,
            isUtgst: false,
            cessRate: '12.00'
        );

        $this->assertEquals('28.00', $taxes['igst_amount']);
        $this->assertEquals('12.00', $taxes['cess_amount']);
        $this->assertEquals('40.00', $taxes['total_tax']);
        $this->assertEquals('140.00', $taxes['item_total']);
    }

    public function test_export_with_payment_vs_without_payment(): void
    {
        // Export With Payment of Tax: Full IGST payable (refundable from customs)
        $withPay = $this->engine->calculateItemTaxes(
            taxableValue: '500000.00',
            gstRate: '18.00',
            isInterstate: true,
            isUtgst: false,
            cessRate: '0.00',
            cessSpecific: '0.00',
            supplyType: GSTCalculationEngine::SUPPLY_EXPORT_WITH_PAYMENT
        );

        $this->assertEquals('90000.00', $withPay['igst_amount']);
        $this->assertEquals('90000.00', $withPay['total_tax']);
        $this->assertEquals('590000.00', $withPay['item_total']);

        // Export Without Payment of Tax under Letter of Undertaking (LUT)
        $withoutPay = $this->engine->calculateItemTaxes(
            taxableValue: '500000.00',
            gstRate: '18.00',
            isInterstate: true,
            isUtgst: false,
            cessRate: '0.00',
            cessSpecific: '0.00',
            supplyType: GSTCalculationEngine::SUPPLY_EXPORT_WITHOUT_PAYMENT
        );

        $this->assertEquals('0.00', $withoutPay['igst_amount']);
        $this->assertEquals('0.00', $withoutPay['total_tax']);
        $this->assertEquals('500000.00', $withoutPay['item_total']);
    }

    public function test_mixed_gst_rates_and_document_totals_aggregation(): void
    {
        // Item 1: 5% GST
        $item1 = $this->engine->calculateItemTaxes(
            taxableValue: '33.33',
            gstRate: '5.00',
            isInterstate: false
        );

        // Item 2: 18% GST
        $item2 = $this->engine->calculateItemTaxes(
            taxableValue: '66.67',
            gstRate: '18.00',
            isInterstate: false
        );

        // Item 3: 28% GST + 1% Cess
        $item3 = $this->engine->calculateItemTaxes(
            taxableValue: '100.00',
            gstRate: '28.00',
            isInterstate: false,
            isUtgst: false,
            cessRate: '1.00'
        );

        $totals = $this->engine->calculateDocumentTotals([$item1, $item2, $item3]);

        // Total Taxable = 33.33 + 66.67 + 100.00 = 200.00
        $this->assertEquals('200.00', $totals['total_taxable_value']);

        // CGST = 0.83 + 6.00 + 14.00 = 20.83
        $this->assertEquals('20.83', $totals['total_cgst']);
        // SGST = 0.83 + 6.00 + 14.00 = 20.83
        $this->assertEquals('20.83', $totals['total_sgst']);
        // Cess = 1.00
        $this->assertEquals('1.00', $totals['total_cess']);

        // Total Tax = 1.66 + 12.00 + 29.00 = 42.66
        $this->assertEquals('42.66', $totals['total_tax_amount']);

        // Subtotal = 200.00 + 42.66 = 242.66
        // Grand Total rounded to nearest whole rupee = 243.00
        $this->assertEquals('243.00', $totals['grand_total']);
        // Round off = 243.00 - 242.66 = 0.34
        $this->assertEquals('0.34', $totals['round_off']);
    }

    public function test_pure_bcmath_rupee_rounding_edge_cases(): void
    {
        // 100.49 -> 100.00 (fraction < 0.50 rounds down)
        $this->assertEquals('100.00', $this->engine->bcroundRupee('100.49'));

        // 100.50 -> 101.00 (half-up rounds up)
        $this->assertEquals('101.00', $this->engine->bcroundRupee('100.50'));

        // 100.51 -> 101.00 (fraction > 0.50 rounds up)
        $this->assertEquals('101.00', $this->engine->bcroundRupee('100.51'));

        // 0.00 -> 0.00
        $this->assertEquals('0.00', $this->engine->bcroundRupee('0.00'));

        // Negative numbers (e.g. credit notes)
        $this->assertEquals('-100.00', $this->engine->bcroundRupee('-100.49'));
        $this->assertEquals('-101.00', $this->engine->bcroundRupee('-100.50'));
    }
}

