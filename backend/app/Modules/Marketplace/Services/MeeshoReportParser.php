<?php

namespace App\Modules\Marketplace\Services;

class MeeshoReportParser
{
    /**
     * Parse Meesho GST Orders & Returns report CSV rows.
     * Extracts Sub-Order No, Order Date, Customer State, Taxable Amount, GST Rate, Final Price.
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

            $orderId = $row[$headerMap['sub order no'] ?? $headerMap['order_id'] ?? 0] ?? null;
            $orderDate = $row[$headerMap['order date'] ?? 1] ?? date('Y-m-d');
            $shipState = $row[$headerMap['customer state'] ?? $headerMap['state'] ?? 2] ?? '27';
            $sku = $row[$headerMap['sku'] ?? $headerMap['supplier sku'] ?? 3] ?? 'MEESHO-SKU';
            $qty = (float) ($row[$headerMap['quantity'] ?? 4] ?? 1);
            $taxableValue = (float) ($row[$headerMap['taxable value'] ?? 5] ?? 0);
            $gstRate = (float) ($row[$headerMap['gst rate'] ?? 6] ?? 18);
            $orderTotal = (float) ($row[$headerMap['final amount'] ?? $headerMap['total_amount'] ?? 7] ?? 0);

            if ($orderId) {
                $taxAmount = ($taxableValue * $gstRate) / 100;
                $records[] = [
                    'channel' => 'meesho',
                    'channel_order_id' => trim($orderId),
                    'external_invoice_number' => 'MEESHO-' . trim($orderId),
                    'order_date' => $orderDate,
                    'shipping_state_code' => trim((string)$shipState),
                    'sku' => trim((string)$sku),
                    'quantity' => $qty,
                    'taxable_value' => $taxableValue,
                    'tax_amount' => $taxAmount,
                    'order_total' => $orderTotal > 0 ? $orderTotal : ($taxableValue + $taxAmount),
                    'raw_payload' => $row,
                ];
            }
        }

        return $records;
    }
}

