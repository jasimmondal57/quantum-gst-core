<?php

namespace App\Modules\Marketplace\Services;

use App\Models\Invoice;
use App\Models\MarketplaceConnection;
use App\Models\MarketplaceOrder;
use Carbon\Carbon;

class MarketplaceReconciliationService
{
    /**
     * Perform multi-channel marketplace financial and GST reconciliation.
     */
    public function reconcile(string $businessId, ?string $channel = null, ?string $fromDate = null, ?string $toDate = null): array
    {
        $connQuery = MarketplaceConnection::where('business_id', $businessId);
        if ($channel) {
            $connQuery->where('channel', $channel);
        }
        $connectionIds = $connQuery->pluck('id')->toArray();

        $orderQuery = MarketplaceOrder::whereIn('marketplace_connection_id', $connectionIds);
        if ($fromDate) {
            $orderQuery->where('order_date', '>=', $fromDate);
        }
        if ($toDate) {
            $orderQuery->where('order_date', '<=', $toDate);
        }

        $orders = $orderQuery->get();

        $totalOrdersCount = $orders->count();
        $totalGrossSales = '0.00';
        $totalMarketplaceFees = '0.00';
        $totalTcsCollected = '0.00';
        $totalTdsDeducted = '0.00';
        $expectedNetSettlement = '0.00';

        $matchedInvoicesCount = 0;
        $unreconciledOrders = [];
        $discrepancyCount = 0;

        foreach ($orders as $order) {
            $orderAmount = (string) $order->order_total;
            $totalGrossSales = bcadd($totalGrossSales, $orderAmount, 2);

            $payload = is_array($order->raw_payload) ? $order->raw_payload : json_decode($order->raw_payload, true) ?? [];

            // Extract marketplace fee, TCS, TDS if present
            $fee = '0.00';
            if (isset($payload['commission'])) {
                $fee = bcadd($fee, (string) $payload['commission'], 2);
            }
            if (isset($payload['fixed_fee'])) {
                $fee = bcadd($fee, (string) $payload['fixed_fee'], 2);
            }
            if (isset($payload['shipping_fee'])) {
                $fee = bcadd($fee, (string) $payload['shipping_fee'], 2);
            }
            $totalMarketplaceFees = bcadd($totalMarketplaceFees, $fee, 2);

            $tcs = isset($payload['tcs_amount']) ? (string) $payload['tcs_amount'] : '0.00';
            $tds = isset($payload['tds_amount']) ? (string) $payload['tds_amount'] : '0.00';
            $totalTcsCollected = bcadd($totalTcsCollected, $tcs, 2);
            $totalTdsDeducted = bcadd($totalTdsDeducted, $tds, 2);

            $netSettlement = isset($payload['settlement_amount'])
                ? (string) $payload['settlement_amount']
                : bcsub(bcsub(bcsub($orderAmount, $fee, 2), $tcs, 2), $tds, 2);
            $expectedNetSettlement = bcadd($expectedNetSettlement, $netSettlement, 2);

            // Reconcile with Quantum GST Invoices
            $matchingInvoice = Invoice::where('business_id', $businessId)
                ->where('external_reference_id', $order->channel_order_id)
                ->first();

            if ($matchingInvoice) {
                $matchedInvoicesCount++;
                if (bccomp((string) $matchingInvoice->grand_total, $orderAmount, 2) !== 0) {
                    $discrepancyCount++;
                    $unreconciledOrders[] = [
                        'channel_order_id' => $order->channel_order_id,
                        'reason' => 'Amount mismatch between marketplace report and GST invoice',
                        'order_amount' => $orderAmount,
                        'invoice_amount' => (string) $matchingInvoice->grand_total,
                        'difference' => bcsub($orderAmount, (string) $matchingInvoice->grand_total, 2),
                    ];
                }
            } else {
                $unreconciledOrders[] = [
                    'channel_order_id' => $order->channel_order_id,
                    'reason' => 'No matching GST Tax Invoice found for marketplace order',
                    'order_amount' => $orderAmount,
                    'order_date' => Carbon::parse($order->order_date)->format('Y-m-d'),
                ];
            }
        }

        return [
            'business_id' => $businessId,
            'channel' => $channel ?? 'all',
            'period' => ['from' => $fromDate, 'to' => $toDate],
            'summary' => [
                'total_orders_count' => $totalOrdersCount,
                'reconciled_invoices_count' => $matchedInvoicesCount,
                'uninvoiced_orders_count' => $totalOrdersCount - $matchedInvoicesCount,
                'amount_discrepancies_count' => $discrepancyCount,
                'total_gross_sales' => $totalGrossSales,
                'total_marketplace_fees' => $totalMarketplaceFees,
                'total_tcs_collected' => $totalTcsCollected,
                'total_tds_deducted' => $totalTdsDeducted,
                'expected_net_settlement' => $expectedNetSettlement,
            ],
            'discrepancies' => array_slice($unreconciledOrders, 0, 50),
        ];
    }
}
