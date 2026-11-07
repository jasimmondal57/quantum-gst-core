<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Organization;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TallyExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setupEnvironment(): array
    {
        $user = User::factory()->create();
        $org = Organization::create(['name' => 'Godrej Material Handling', 'slug' => 'godrej-handling']);
        $org->users()->attach($user->id, [
            'id' => (string) Str::uuid(),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $business = Business::create([
            'organization_id' => $org->id,
            'legal_name' => 'Godrej Material Handling Ltd',
            'trade_name' => 'Godrej Logistics',
        ]);

        $gstin = BusinessGstin::create([
            'business_id' => $business->id,
            'gstin' => '27AAACG1111F1Z2',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
            'legal_name' => 'Godrej Material Handling Ltd',
            'is_primary' => true,
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'b2b',
            'name' => 'Tata Steel Processing Ltd',
            'company_name' => 'Tata Steel',
            'gstin' => '27AAACT2222F1Z4',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
        ]);

        $supplier = Customer::create([
            'business_id' => $business->id,
            'customer_type' => 'supplier',
            'name' => 'Jindal Steel & Power Ltd',
            'company_name' => 'Jindal Steel',
            'gstin' => '27AAACJ3333F1Z6',
            'state_code' => '27',
            'state_name' => 'Maharashtra',
        ]);

        $product = Product::create([
            'business_id' => $business->id,
            'name' => 'Hydraulic Pallet Truck 2.5T',
            'hsn_sac' => '84271000',
            'sku' => 'HPT-2500',
            'unit' => 'NOS',
            'sale_price' => '25000.00',
            'purchase_price' => '18000.00',
            'status' => 'active',
        ]);

        // Sales Invoice
        $invoice = Invoice::create([
            'organization_id' => $org->id,
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'customer_id' => $customer->id,
            'invoice_number' => 'INV-2026-TLY-01',
            'invoice_date' => '2026-11-08',
            'place_of_supply_state_code' => '27',
            'is_interstate' => false,
            'total_taxable_value' => '25000.00',
            'total_cgst' => '2250.00',
            'total_sgst' => '2250.00',
            'total_igst' => '0.00',
            'total_cess' => '0.00',
            'total_tax_amount' => '4500.00',
            'grand_total' => '29500.00',
            'status' => 'issued',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'product_id' => $product->id,
            'item_name' => $product->name,
            'hsn_sac' => $product->hsn_sac,
            'quantity' => '1.000',
            'unit_price' => '25000.00',
            'taxable_value' => '25000.00',
            'cgst_rate' => '9.00',
            'cgst_amount' => '2250.00',
            'sgst_rate' => '9.00',
            'sgst_amount' => '2250.00',
            'igst_rate' => '0.00',
            'igst_amount' => '0.00',
            'total_amount' => '29500.00',
        ]);

        // Purchase Bill
        $purchase = PurchaseBill::create([
            'business_id' => $business->id,
            'business_gstin_id' => $gstin->id,
            'supplier_id' => $supplier->id,
            'bill_number' => 'PB-JND-9921',
            'bill_date' => '2026-11-05',
            'place_of_supply_state_code' => '27',
            'is_interstate' => false,
            'total_taxable_value' => '18000.00',
            'total_cgst' => '1620.00',
            'total_sgst' => '1620.00',
            'total_igst' => '0.00',
            'total_cess' => '0.00',
            'total_tax_amount' => '3240.00',
            'grand_total' => '21240.00',
            'status' => 'received',
        ]);

        PurchaseBillItem::create([
            'purchase_bill_id' => $purchase->id,
            'product_id' => $product->id,
            'item_name' => $product->name,
            'hsn_sac' => $product->hsn_sac,
            'quantity' => '1.000',
            'unit_price' => '18000.00',
            'taxable_value' => '18000.00',
            'cgst_rate' => '9.00',
            'cgst_amount' => '1620.00',
            'sgst_rate' => '9.00',
            'sgst_amount' => '1620.00',
            'igst_rate' => '0.00',
            'igst_amount' => '0.00',
            'total_amount' => '21240.00',
        ]);

        return compact('user', 'business', 'invoice', 'purchase');
    }

    public function test_tally_xml_export_structure(): void
    {
        $env = $this->setupEnvironment();

        $response = $this->actingAs($env['user'], 'sanctum')
            ->getJson("/api/v1/export/tally-xml?business_id={$env['business']->id}&type=all");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');

        $xmlContent = $response->getContent();

        // 1. Check Envelope and Request Desc
        $this->assertStringContainsString('<ENVELOPE>', $xmlContent);
        $this->assertStringContainsString('<TALLYREQUEST>Import Data</TALLYREQUEST>', $xmlContent);
        $this->assertStringContainsString('<SVCURRENTCOMPANY>Godrej Logistics</SVCURRENTCOMPANY>', $xmlContent);

        // 2. Check Ledger Masters
        $this->assertStringContainsString('<LEDGER NAME="Tata Steel" ACTION="Create">', $xmlContent);
        $this->assertStringContainsString('<PARENT>Sundry Debtors</PARENT>', $xmlContent);
        $this->assertStringContainsString('<PARTYGSTIN>27AAACT2222F1Z4</PARTYGSTIN>', $xmlContent);

        $this->assertStringContainsString('<LEDGER NAME="Jindal Steel" ACTION="Create">', $xmlContent);
        $this->assertStringContainsString('<PARENT>Sundry Creditors</PARENT>', $xmlContent);

        // 3. Check Stock Item Masters
        $this->assertStringContainsString('<STOCKITEM NAME="Hydraulic Pallet Truck 2.5T" ACTION="Create">', $xmlContent);
        $this->assertStringContainsString('<HSNCODE>84271000</HSNCODE>', $xmlContent);

        // 4. Check Sales Voucher
        $this->assertStringContainsString('<VOUCHER VCHTYPE="Sales" ACTION="Create">', $xmlContent);
        $this->assertStringContainsString('<VOUCHERNUMBER>INV-2026-TLY-01</VOUCHERNUMBER>', $xmlContent);
        $this->assertStringContainsString('<PARTYLEDGERNAME>Tata Steel</PARTYLEDGERNAME>', $xmlContent);
        $this->assertStringContainsString('<LEDGERNAME>Sales GST</LEDGERNAME>', $xmlContent);
        $this->assertStringContainsString('<AMOUNT>25000.00</AMOUNT>', $xmlContent);
        $this->assertStringContainsString('<LEDGERNAME>CGST Output</LEDGERNAME>', $xmlContent);
        $this->assertStringContainsString('<AMOUNT>2250.00</AMOUNT>', $xmlContent);

        // 5. Check Purchase Voucher
        $this->assertStringContainsString('<VOUCHER VCHTYPE="Purchase" ACTION="Create">', $xmlContent);
        $this->assertStringContainsString('<VOUCHERNUMBER>PB-JND-9921</VOUCHERNUMBER>', $xmlContent);
        $this->assertStringContainsString('<PARTYLEDGERNAME>Jindal Steel</PARTYLEDGERNAME>', $xmlContent);
        $this->assertStringContainsString('<LEDGERNAME>Purchase GST</LEDGERNAME>', $xmlContent);
        $this->assertStringContainsString('<AMOUNT>-18000.00</AMOUNT>', $xmlContent);
    }
}
