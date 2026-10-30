<?php

namespace App\Modules\Shopify\Services;

class ShopifyGstBridge
{
    /**
     * Map Indian state name from Shopify shipping address to statutory GST state code.
     */
    public function getStateCode(string $stateName): string
    {
        $states = [
            'jammu and kashmir' => '01',
            'himachal pradesh' => '02',
            'punjab' => '03',
            'chandigarh' => '04',
            'uttarakhand' => '05',
            'haryana' => '06',
            'delhi' => '07',
            'rajasthan' => '08',
            'uttar pradesh' => '09',
            'bihar' => '10',
            'sikkim' => '11',
            'arunachal pradesh' => '12',
            'nagaland' => '13',
            'manipur' => '14',
            'mizoram' => '15',
            'tripura' => '16',
            'meghalaya' => '17',
            'assam' => '18',
            'west bengal' => '19',
            'jharkhand' => '20',
            'odisha' => '21',
            'chhattisgarh' => '22',
            'madhya pradesh' => '23',
            'gujarat' => '24',
            'dadra and nagar haveli' => '26',
            'daman and diu' => '26',
            'maharashtra' => '27',
            'andhra pradesh' => '37',
            'karnataka' => '29',
            'goa' => '30',
            'lakshadweep' => '31',
            'kerala' => '32',
            'tamil nadu' => '33',
            'puducherry' => '34',
            'andaman and nicobar' => '35',
            'telangana' => '36',
            'ladakh' => '38',
        ];

        $key = strtolower(trim($stateName));
        return $states[$key] ?? '27'; // Defaults to primary state if unmapped
    }

    /**
     * Normalize Shopify Webhook Order payload into standardized GST line items.
     */
    public function normalizeShopifyOrder(array $orderPayload): array
    {
        $shipping = $orderPayload['shipping_address'] ?? $orderPayload['billing_address'] ?? [];
        $stateName = $shipping['province'] ?? $shipping['city'] ?? 'Maharashtra';
        $stateCode = $this->getStateCode($stateName);

        $lineItems = [];
        foreach ($orderPayload['line_items'] ?? [] as $item) {
            $taxLines = $item['tax_lines'] ?? [];
            $gstRate = 0;
            foreach ($taxLines as $tax) {
                $gstRate += (float) ($tax['rate'] ?? 0) * 100;
            }

            if ($gstRate === 0) {
                $gstRate = 18; // Standard fallback
            }

            $lineItems[] = [
                'item_name' => $item['name'] ?? $item['title'] ?? 'Store Product',
                'sku' => $item['sku'] ?? 'SHOPIFY-SKU',
                'hsn_sac' => $item['properties']['HSN'] ?? '998313',
                'quantity' => (float) ($item['quantity'] ?? 1),
                'unit_price' => (float) ($item['price'] ?? 0),
                'gst_rate' => $gstRate,
                'tax_inclusive' => true,
            ];
        }

        return [
            'shopify_order_id' => (string) ($orderPayload['id'] ?? 'SHPFY-' . time()),
            'order_number' => (string) ($orderPayload['name'] ?? $orderPayload['order_number'] ?? 'ORD-001'),
            'customer_name' => trim(($shipping['first_name'] ?? '') . ' ' . ($shipping['last_name'] ?? '')) ?: 'Online Shopper',
            'customer_email' => $orderPayload['email'] ?? null,
            'customer_phone' => $shipping['phone'] ?? $orderPayload['phone'] ?? null,
            'shipping_address' => trim(($shipping['address1'] ?? '') . ' ' . ($shipping['city'] ?? '') . ' ' . ($shipping['zip'] ?? '')),
            'place_of_supply_state_code' => $stateCode,
            'order_total' => (float) ($orderPayload['total_price'] ?? 0),
            'items' => $lineItems,
        ];
    }
}

