<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EWayBill;
use App\Models\Invoice;
use App\Models\StockTransfer;
use App\Modules\GSTEngine\Services\EWayBillService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EWayBillController extends Controller
{
    protected EWayBillService $ewayService;

    public function __construct(EWayBillService $ewayService)
    {
        $this->ewayService = $ewayService;
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
     * List E-Way Bills for a business.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|uuid|exists:businesses,id',
            'status' => 'nullable|string|in:active,cancelled,extended',
        ]);

        $this->authorizeBusiness($request, $validated['business_id']);

        $query = EWayBill::where('business_id', $validated['business_id'])
            ->with(['invoice', 'stockTransfer'])
            ->latest('eway_bill_date');

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Generate E-Way Bill for an Invoice.
     */
    public function generateForInvoice(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|uuid|exists:invoices,id',
            'distance_km' => 'required|integer|min:1',
            'transport_mode' => 'nullable|string|in:road,rail,air,ship',
            'vehicle_number' => 'nullable|string|max:20',
            'vehicle_type' => 'nullable|string|in:regular,over_dimensional_cargo',
            'transporter_id' => 'nullable|string|max:15',
            'transporter_name' => 'nullable|string|max:255',
            'trans_doc_no' => 'nullable|string|max:50',
            'trans_doc_date' => 'nullable|date',
        ]);

        $invoice = Invoice::findOrFail($validated['invoice_id']);
        $this->authorizeBusiness($request, $invoice->business_id);

        $ewayBill = $this->ewayService->generateForInvoice(
            invoice: $invoice,
            distanceKm: (int) $validated['distance_km'],
            transportMode: $validated['transport_mode'] ?? 'road',
            vehicleNumber: $validated['vehicle_number'] ?? null,
            vehicleType: $validated['vehicle_type'] ?? 'regular',
            transporterId: $validated['transporter_id'] ?? null,
            transporterName: $validated['transporter_name'] ?? null,
            transDocNo: $validated['trans_doc_no'] ?? null,
            transDocDate: $validated['trans_doc_date'] ?? null
        );

        return response()->json($ewayBill, 201);
    }

    /**
     * Generate E-Way Bill for a Stock Transfer.
     */
    public function generateForStockTransfer(Request $request)
    {
        $validated = $request->validate([
            'stock_transfer_id' => 'required|uuid|exists:stock_transfers,id',
            'distance_km' => 'required|integer|min:1',
            'vehicle_number' => 'required|string|max:20',
            'transporter_name' => 'nullable|string|max:255',
        ]);

        $transfer = StockTransfer::findOrFail($validated['stock_transfer_id']);
        $this->authorizeBusiness($request, $transfer->business_id);

        $ewayBill = $this->ewayService->generateForStockTransfer(
            transfer: $transfer,
            distanceKm: (int) $validated['distance_km'],
            vehicleNumber: $validated['vehicle_number'],
            transporterName: $validated['transporter_name'] ?? null
        );

        return response()->json($ewayBill, 201);
    }

    /**
     * Show E-Way Bill Details.
     */
    public function show(Request $request, string $id)
    {
        $eway = EWayBill::with(['invoice', 'stockTransfer'])->findOrFail($id);
        $this->authorizeBusiness($request, $eway->business_id);

        return response()->json($eway);
    }

    /**
     * Update Part-B Vehicle details for an active E-Way Bill.
     */
    public function updateVehicle(Request $request, string $id)
    {
        $eway = EWayBill::findOrFail($id);
        $this->authorizeBusiness($request, $eway->business_id);

        $validated = $request->validate([
            'vehicle_number' => 'required|string|max:20',
            'reason' => 'nullable|string|max:255',
        ]);

        $updated = $this->ewayService->updateVehicle(
            ewayBill: $eway,
            newVehicleNumber: $validated['vehicle_number'],
            reason: $validated['reason'] ?? null
        );

        return response()->json($updated);
    }

    /**
     * Cancel an active E-Way Bill.
     */
    public function cancel(Request $request, string $id)
    {
        $eway = EWayBill::findOrFail($id);
        $this->authorizeBusiness($request, $eway->business_id);

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $cancelled = $this->ewayService->cancelEWayBill($eway, $validated['reason']);

        return response()->json($cancelled);
    }
}

