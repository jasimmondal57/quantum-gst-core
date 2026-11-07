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
}

