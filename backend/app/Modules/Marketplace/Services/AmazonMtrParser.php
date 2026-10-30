<?php

namespace App\Modules\Marketplace\Services;

class AmazonMtrParser
{
    /**
     * Parse Amazon Merchant Tax Report (MTR) CSV rows.
     * Extracts Order ID, Invoice Number, Ship Date, State Code, Taxable Value, CGST, SGST, IGST.
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

            $orderId = $row[$headerMap['order id'] ?? $headerMap['order_id'] ?? 0] ?? null;
            $invoiceNumber = $row[$headerMap['invoice number'] ?? $headerMap['invoice_number'] ?? 1] ?? null;
            $orderDate = $row[$headerMap['invoice date'] ?? $headerMap['order_date'] ?? 2] ?? date('Y-m-d');
            $shipState = $row[$headerMap['ship to state'] ?? $headerMap['state'] ?? 3] ?? '27';
            $sku = $row[$headerMap['sku'] ?? 4] ?? 'GEN-SKU';
            $qty = (float) ($row[$headerMap['quantity'] ?? 5] ?? 1);
            $taxableValue = (float) ($row[$headerMap['item tax base amount'] ?? $headerMap['taxable_value'] ?? 6] ?? 0);
            $totalTax = (float) ($row[$headerMap['item tax amount'] ?? $headerMap['tax_amount'] ?? 7] ?? 0);
            $orderTotal = (float) ($row[$headerMap['invoice amount'] ?? $headerMap['total_amount'] ?? 8] ?? ($taxableValue + $totalTax));

            if ($orderId) {
                $records[] = [
                    'channel' => 'amazon',
                    'channel_order_id' => trim($orderId),
                    'external_invoice_number' => trim((string)$invoiceNumber),
                    'order_date' => $orderDate,
                    'shipping_state_code' => trim((string)$shipState),
                    'sku' => trim((string)$sku),
                    'quantity' => $qty,
                    'taxable_value' => $taxableValue,
                    'tax_amount' => $totalTax,
                    'order_total' => $orderTotal,
                    'raw_payload' => $row,
                ];
            }
        }

        return $records;
    }
}

