<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessGstin;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceSequence;
use App\Modules\GSTEngine\Services\GSTCalculationEngine;
use App\Modules\Shopify\Services\ShopifyGstBridge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopifyController extends Controller
{
    protected ShopifyGstBridge $bridge;
    protected GSTCalculationEngine $gstEngine;

    public function __construct(ShopifyGstBridge $bridge, GSTCalculationEngine $gstEngine)
    {
        $this->bridge = $bridge;
        $this->gstEngine = $gstEngine;
    }

    /**
     * Handle Shopify orders/create webhook for automatic GST tax invoice generation.
     */
    public function handleOrderWebhook(Request $request)
    {
        $businessId = $request->query('business_id');
        $business = Business::with('gstins')->find($businessId);

        if (! $business || $business->gstins->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Valid business with active GSTIN required.',
            ], 400);
        }

        $payload = $request->all();
        $normalized = $this->bridge->normalizeShopifyOrder($payload);

        return DB::transaction(function () use ($business, $normalized) {
            $gstin = $business->gstins->firstWhere('is_primary', true) ?? $business->gstins->first();
            $posStateCode = $normalized['place_of_supply_state_code'];
            $isInterstate = $this->gstEngine->isInterstate($gstin->state_code, $posStateCode);

            // Upsert B2C / eCommerce Customer
            $customer = Customer::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'email' => $normalized['customer_email'],
                ],
                [
                    'customer_type' => 'b2c',
                    'name' => $normalized['customer_name'],
                    'phone' => $normalized['customer_phone'],
                    'state_code' => $posStateCode,
                    'state_name' => 'Online Customer State',
                    'billing_address' => $normalized['shipping_address'],
                ]
            );

            // Calculate GST line item splits
            $calculatedItems = [];
            foreach ($normalized['items'] as $item) {
                $qty = (string) $item['quantity'];
                $grossUnit = (string) $item['unit_price'];
                $totalGross = bcmul($qty, $grossUnit, 4);

                // Extract base taxable from tax-inclusive retail price
                $taxableBase = $this->gstEngine->extractTaxableFromInclusive(
                    $totalGross,
                    (string) $item['gst_rate']
                );

                $taxBreakdown = $this->gstEngine->calculateItemTaxes(
                    $taxableBase,
                    (string) $item['gst_rate'],
                    $isInterstate
                );

                $calculatedItems[] = array_merge($item, $taxBreakdown);
            }

            $totals = $this->gstEngine->calculateDocumentTotals($calculatedItems);

            // Financial year sequence
            $now = Carbon::now();
            $fyStart = $now->month >= 4 ? $now->year : $now->year - 1;
            $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

            $sequence = InvoiceSequence::firstOrCreate(
                [
                    'business_id' => $business->id,
                    'business_gstin_id' => $gstin->id,
                    'document_type' => 'invoice',
                    'financial_year' => $fyString,
                ],
                [
                    'prefix' => 'SPF/',
                    'next_number' => 1,
                ]
            );

            $invoiceNumber = $sequence->prefix . $fyString . '/' . str_pad((string) $sequence->next_number, 4, '0', STR_PAD_LEFT);
            $sequence->increment('next_number');

            $invoice = Invoice::create([
                'organization_id' => $business->organization_id,
                'business_id' => $business->id,
                'business_gstin_id' => $gstin->id,
                'customer_id' => $customer->id,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $now->toDateString(),
                'invoice_type' => 'tax_invoice',
                'status' => 'finalized',
                'place_of_supply_state_code' => $posStateCode,
                'is_interstate' => $isInterstate,
                'total_taxable_value' => $totals['total_taxable_value'],
                'total_cgst' => $totals['total_cgst'],
                'total_sgst' => $totals['total_sgst'],
                'total_igst' => $totals['total_igst'],
                'total_tax_amount' => $totals['total_tax_amount'],
                'round_off' => $totals['round_off'],
                'grand_total' => $totals['grand_total'],
                'source' => 'shopify',
                'external_reference_id' => $normalized['shopify_order_id'],
                'source_metadata' => [
                    'order_number' => $normalized['order_number'],
                ],
            ]);

            foreach ($calculatedItems as $calcItem) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'item_name' => $calcItem['item_name'],
                    'hsn_sac' => $calcItem['hsn_sac'],
                    'quantity' => $calcItem['quantity'],
                    'unit' => 'NOS',
                    'unit_price' => $calcItem['unit_price'],
                    'taxable_value' => $calcItem['taxable_value'],
                    'cgst_rate' => $calcItem['cgst_rate'],
                    'cgst_amount' => $calcItem['cgst_amount'],
                    'sgst_rate' => $calcItem['sgst_rate'],
                    'sgst_amount' => $calcItem['sgst_amount'],
                    'igst_rate' => $calcItem['igst_rate'],
                    'igst_amount' => $calcItem['igst_amount'],
                    'total_amount' => $calcItem['item_total'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Shopify order invoiced successfully.',
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'grand_total' => $invoice->grand_total,
                'pdf_url' => url("/api/v1/invoices/{$invoice->id}/pdf"),
            ], 201);
        });
    }
}
