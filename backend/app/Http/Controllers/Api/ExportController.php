<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TallyExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    protected TallyExportService $tallyService;

    public function __construct(TallyExportService $tallyService)
    {
        $this->tallyService = $tallyService;
    }

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

    /**
     * Export data to Tally XML format (Masters + Vouchers).
     */
    public function tallyXml(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'type' => 'nullable|string|in:all,masters,vouchers',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $type = $validated['type'] ?? 'all';
        $businessId = $validated['business_id'];
        $fromDate = $validated['from_date'] ?? null;
        $toDate = $validated['to_date'] ?? null;

        $xml = match ($type) {
            'masters' => $this->tallyService->generateLedgerMasters($businessId) . $this->tallyService->generateStockItemMasters($businessId),
            'vouchers' => $this->tallyService->generateVouchers($businessId, $fromDate, $toDate),
            default => $this->tallyService->exportAll($businessId, $fromDate, $toDate),
        };

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Content-Disposition' => 'attachment; filename="quantum_gst_tally_export_' . date('Ymd_His') . '.xml"',
        ]);
    }
}

