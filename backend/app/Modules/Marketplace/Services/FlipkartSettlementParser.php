<?php

namespace App\Modules\Marketplace\Services;

class FlipkartSettlementParser
{
    /**
     * Parse Flipkart Sales and Settlement Report CSV rows.
     * Extracts Order ID, Invoice Number, Order Date, Customer State, Taxable Value, GST, Fees, TCS, and Net Settlement.
     */
    public function parseCsv(string $csvContent): array
    {
        $lines = explode("\n", trim($csvContent));
        if (count($lines) < 2) {
            return [];
        }

        $header = str_getcsv(array_shift($lines));
        $headerMap = array_flip(array_map('trim', array_map('strtolower', $header)));

        $records = [];
        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $row = str_getcsv($line);

            // Column variations across Flipkart Seller reports
            $orderId = $row[$headerMap['order id'] ?? $headerMap['order_id'] ?? $headerMap['order item id'] ?? 0] ?? null;
            $invoiceNumber = $row[$headerMap['invoice number'] ?? $headerMap['invoice_number'] ?? $headerMap['fsin'] ?? 1] ?? null;
            $orderDate = $row[$headerMap['order date'] ?? $headerMap['invoice date'] ?? $headerMap['date'] ?? 2] ?? date('Y-m-d');
            $shipState = $row[$headerMap['customer state'] ?? $headerMap['delivery state'] ?? $headerMap['state'] ?? 3] ?? '27';
            $sku = $row[$headerMap['fsn'] ?? $headerMap['sku'] ?? $headerMap['seller sku'] ?? 4] ?? 'FK-SKU';
            $qty = (float) ($row[$headerMap['quantity'] ?? $headerMap['qty'] ?? 5] ?? 1);
            
            $taxableValue = (float) ($row[$headerMap['taxable value'] ?? $headerMap['taxable amount'] ?? $headerMap['item taxable value'] ?? 6] ?? 0);
            $totalTax = (float) ($row[$headerMap['total tax'] ?? $headerMap['tax amount'] ?? $headerMap['gst amount'] ?? 7] ?? 0);
            $orderTotal = (float) ($row[$headerMap['order amount'] ?? $headerMap['invoice amount'] ?? $headerMap['sale amount'] ?? 8] ?? ($taxableValue + $totalTax));

            // Marketplace deductions & TCS
            $commission = (float) ($row[$headerMap['commission fee'] ?? $headerMap['commission'] ?? -1] ?? 0);
            $fixedFee = (float) ($row[$headerMap['fixed fee'] ?? -1] ?? 0);
            $shippingFee = (float) ($row[$headerMap['shipping fee'] ?? $headerMap['logistics fee'] ?? -1] ?? 0);
            $tcs = (float) ($row[$headerMap['tcs amount'] ?? $headerMap['tcs'] ?? -1] ?? 0);
            $tds = (float) ($row[$headerMap['tds amount'] ?? $headerMap['tds'] ?? -1] ?? 0);
            $settlementAmount = (float) ($row[$headerMap['bank settlement amount'] ?? $headerMap['settlement value'] ?? $headerMap['net amount'] ?? -1] ?? 0);

            if ($orderId) {
                $records[] = [
                    'channel' => 'flipkart',
                    'channel_order_id' => trim($orderId),
                    'external_invoice_number' => trim((string)$invoiceNumber),
                    'order_date' => $orderDate,
                    'shipping_state_code' => trim((string)$shipState),
                    'sku' => trim((string)$sku),
                    'quantity' => $qty,
                    'taxable_value' => $taxableValue,
                    'tax_amount' => $totalTax,
                    'order_total' => $orderTotal,
                    'commission' => $commission,
                    'fixed_fee' => $fixedFee,
                    'shipping_fee' => $shippingFee,
                    'tcs_amount' => $tcs,
                    'tds_amount' => $tds,
                    'settlement_amount' => $settlementAmount > 0 ? $settlementAmount : ($orderTotal - ($commission + $fixedFee + $shippingFee + $tcs + $tds)),
                    'raw_payload' => $row,
                ];
            }
        }

        return $records;
    }
}

