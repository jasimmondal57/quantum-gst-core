<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketplaceConnection;
use App\Models\MarketplaceOrder;
use App\Modules\Marketplace\Services\AmazonMtrParser;
use App\Modules\Marketplace\Services\FlipkartSettlementParser;
use App\Modules\Marketplace\Services\MeeshoReportParser;
use App\Modules\Marketplace\Services\MarketplaceReconciliationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MarketplaceImportController extends Controller
{
    /**
     * Tenant verification helper.
     */
    protected function authorizeBusiness(Request $request, string $businessId): void
    {
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $allowed = DB::table('businesses')
                ->where('id', $businessId)
                ->whereIn('organization_id', $userOrgIds)
                ->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized: Business does not belong to your organization.');
            }
        }
    }

    public function import(
        Request $request,
        AmazonMtrParser $amazonParser,
        MeeshoReportParser $meeshoParser,
        FlipkartSettlementParser $flipkartParser
    ) {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'channel' => 'required|string|in:amazon,meesho,flipkart',
            'file_content' => 'required|string',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $channel = $validated['channel'];
        $content = $validated['file_content'];

        $parsedRows = match ($channel) {
            'amazon' => $amazonParser->parseCsv($content),
            'meesho' => $meeshoParser->parseCsv($content),
            'flipkart' => $flipkartParser->parseCsv($content),
            default => [],
        };

        if (empty($parsedRows)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid order rows could be extracted from the report.',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $channel, $parsedRows) {
            $connection = MarketplaceConnection::firstOrCreate(
                [
                    'business_id' => $validated['business_id'],
                    'channel' => $channel,
                ],
                [
                    'organization_id' => DB::table('businesses')->where('id', $validated['business_id'])->value('organization_id'),
                    'account_name' => ucfirst($channel) . ' Primary Store',
                    'status' => 'active',
                ]
            );

            $importedCount = 0;
            $skippedCount = 0;

            foreach ($parsedRows as $row) {
                $order = MarketplaceOrder::updateOrCreate(
                    [
                        'marketplace_connection_id' => $connection->id,
                        'channel_order_id' => $row['channel_order_id'],
                    ],
                    [
                        'order_date' => Carbon::parse($row['order_date']),
                        'order_status' => 'completed',
                        'customer_name' => 'Marketplace Buyer',
                        'shipping_state_code' => $row['shipping_state_code'],
                        'order_total' => $row['order_total'],
                        'raw_payload' => $row,
                        'sync_status' => 'pending',
                    ]
                );

                if ($order->wasRecentlyCreated) {
                    $importedCount++;
                } else {
                    $skippedCount++;
                }
            }

            $connection->update(['last_synced_at' => now()]);

            return response()->json([
                'success' => true,
                'channel' => $channel,
                'imported_count' => $importedCount,
                'skipped_count' => $skippedCount,
                'total_processed' => count($parsedRows),
            ], 200);
        });
    }

    public function orders(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();
        $businessId = $request->query('business_id');

        $query = MarketplaceOrder::with('marketplaceConnection');

        if ($user) {
            $userOrgIds = $user->organizations()->pluck('organizations.id')->toArray();
            $query->whereHas('marketplaceConnection.business', function ($q) use ($userOrgIds) {
                $q->whereIn('organization_id', $userOrgIds);
            });
        }

        if ($businessId) {
            $this->authorizeBusiness($request, $businessId);
            $query->whereHas('marketplaceConnection', function ($q) use ($businessId) {
                $q->where('business_id', $businessId);
            });
        }

        return response()->json($query->latest('order_date')->paginate(50));
    }

    /**
     * Reconcile marketplace orders against issued GST invoices and payments.
     */
    public function reconciliation(Request $request, MarketplaceReconciliationService $service)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'channel' => 'nullable|string|in:amazon,meesho,flipkart',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $report = $service->reconcile(
            businessId: $validated['business_id'],
            channel: $validated['channel'] ?? null,
            fromDate: $validated['from_date'] ?? null,
            toDate: $validated['to_date'] ?? null
        );

        return response()->json($report);
    }
}
