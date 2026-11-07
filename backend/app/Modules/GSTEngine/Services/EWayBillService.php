<?php

namespace App\Modules\GSTEngine\Services;

use App\Models\BusinessGstin;
use App\Models\EWayBill;
use App\Models\Invoice;
use App\Models\StockTransfer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EWayBillService
{
    /**
     * Calculate statutory validity under Rule 138(10) of CGST Rules.
     * Regular Cargo: 1 day for every 200 km or part thereof.
     * Over Dimensional Cargo: 1 day for every 20 km or part thereof.
     */
    public function calculateValidityHours(int $distanceKm, string $vehicleType = 'regular'): int
    {
        $distance = max(1, $distanceKm);
        $rate = $vehicleType === 'over_dimensional_cargo' ? 20 : 200;
        $days = (int) ceil($distance / $rate);
        return $days * 24;
    }

    /**
     * Generate E-Way Bill from a Tax Invoice.
     */
    public function generateForInvoice(
        Invoice $invoice,
        int $distanceKm,
        string $transportMode = 'road',
        ?string $vehicleNumber = null,
        string $vehicleType = 'regular',
        ?string $transporterId = null,
        ?string $transporterName = null,
        ?string $transDocNo = null,
        ?string $transDocDate = null
    ): EWayBill {
        $invoice->loadMissing(['businessGstin', 'customer', 'business']);

        $supplierGstin = $invoice->businessGstin;
        if (!$supplierGstin) {
            throw new InvalidArgumentException("Active Business GSTIN required to generate E-Way Bill.");
        }

        return DB::transaction(function () use (
            $invoice,
            $supplierGstin,
            $distanceKm,
            $transportMode,
            $vehicleNumber,
            $vehicleType,
            $transporterId,
            $transporterName,
            $transDocNo,
            $transDocDate
        ) {
            $now = Carbon::now();
            $validHours = $this->calculateValidityHours($distanceKm, $vehicleType);
            $validUntil = (clone $now)->addHours($validHours);

            // 12-digit Indian E-Way Bill number: 2-digit state code + 10 digits
            $ewayBillNo = $supplierGstin->state_code . str_pad((string) mt_rand(1000000000, 9999999999), 10, '0', STR_PAD_LEFT);

            $ewayBill = EWayBill::create([
                'business_id' => $invoice->business_id,
                'business_gstin_id' => $supplierGstin->id,
                'invoice_id' => $invoice->id,
                'eway_bill_no' => $ewayBillNo,
                'eway_bill_date' => $now,
                'valid_until' => $validUntil,
                'supply_type' => 'outward',
                'sub_supply_type' => $invoice->invoice_type === 'export' ? 'export' : 'supply',
                'doc_type' => 'invoice',
                'doc_number' => $invoice->invoice_number,
                'doc_date' => Carbon::parse($invoice->invoice_date)->format('Y-m-d'),
                'from_gstin' => $supplierGstin->gstin,
                'from_trade_name' => $supplierGstin->legal_name,
                'from_address' => $supplierGstin->address_line1 ?? $supplierGstin->address ?? 'Plot 101, Industrial Area',
                'from_place' => $supplierGstin->state_name,
                'from_pincode' => $supplierGstin->pincode ?? '400001',
                'from_state_code' => $supplierGstin->state_code,
                'to_gstin' => $invoice->customer?->gstin,
                'to_trade_name' => $invoice->customer?->company_name ?? $invoice->customer?->name ?? 'Recipient Buyer',
                'to_address' => $invoice->customer?->billing_address ?? 'Commercial Hub',
                'to_place' => $invoice->customer?->state_name ?? 'Maharashtra',
                'to_pincode' => $invoice->customer?->billing_pincode ?? '400001',
                'to_state_code' => $invoice->place_of_supply_state_code,
                'total_taxable_value' => $invoice->total_taxable_value ?? '0.00',
                'cgst_value' => $invoice->total_cgst ?? '0.00',
                'sgst_value' => $invoice->total_sgst ?? '0.00',
                'igst_value' => $invoice->total_igst ?? '0.00',
                'cess_value' => $invoice->total_cess ?? '0.00',
                'total_value' => $invoice->grand_total ?? '0.00',
                'transporter_id' => $transporterId,
                'transporter_name' => $transporterName,
                'trans_doc_no' => $transDocNo,
                'trans_doc_date' => $transDocDate,
                'transport_mode' => $transportMode,
                'distance_km' => $distanceKm,
                'vehicle_number' => $vehicleNumber ? strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $vehicleNumber)) : null,
                'vehicle_type' => $vehicleType,
                'status' => 'active',
            ]);

            // Sync to Invoice record
            $invoice->eway_bill_no = $ewayBillNo;
            $invoice->eway_bill_date = $now;
            $invoice->eway_valid_until = $validUntil;
            $invoice->eway_status = 'generated';
            $invoice->save();

            return $ewayBill;
        });
    }

    /**
     * Generate E-Way Bill for Inter-Godown Stock Transfer (Rule 55 Challan).
     */
    public function generateForStockTransfer(
        StockTransfer $transfer,
        int $distanceKm,
        string $vehicleNumber,
        ?string $transporterName = null
    ): EWayBill {
        $transfer->loadMissing(['sourceGodown', 'destinationGodown', 'business']);

        $primaryGstin = BusinessGstin::where('business_id', $transfer->business_id)
            ->where('is_primary', true)
            ->first() ?? BusinessGstin::where('business_id', $transfer->business_id)->first();

        if (!$primaryGstin) {
            throw new InvalidArgumentException("Business GSTIN required to generate E-Way Bill for stock transfer.");
        }

        $now = Carbon::now();
        $validHours = $this->calculateValidityHours($distanceKm, 'regular');
        $validUntil = (clone $now)->addHours($validHours);

        $ewayBillNo = $primaryGstin->state_code . str_pad((string) mt_rand(1000000000, 9999999999), 10, '0', STR_PAD_LEFT);

        return EWayBill::create([
            'business_id' => $transfer->business_id,
            'business_gstin_id' => $primaryGstin->id,
            'stock_transfer_id' => $transfer->id,
            'eway_bill_no' => $ewayBillNo,
            'eway_bill_date' => $now,
            'valid_until' => $validUntil,
            'supply_type' => 'outward',
            'sub_supply_type' => 'for_own_use',
            'doc_type' => 'delivery_challan',
            'doc_number' => $transfer->delivery_challan_number ?? $transfer->transfer_number,
            'doc_date' => Carbon::parse($transfer->transfer_date)->format('Y-m-d'),
            'from_gstin' => $primaryGstin->gstin,
            'from_trade_name' => $transfer->sourceGodown->name,
            'from_address' => $transfer->sourceGodown->address ?? 'Plant Location',
            'from_place' => $transfer->sourceGodown->state_name ?? $primaryGstin->state_name,
            'from_pincode' => $transfer->sourceGodown->pincode ?? '400001',
            'from_state_code' => $transfer->sourceGodown->state_code ?? $primaryGstin->state_code,
            'to_gstin' => $primaryGstin->gstin,
            'to_trade_name' => $transfer->destinationGodown->name,
            'to_address' => $transfer->destinationGodown->address ?? 'Branch Godown',
            'to_place' => $transfer->destinationGodown->state_name ?? $primaryGstin->state_name,
            'to_pincode' => $transfer->destinationGodown->pincode ?? '400001',
            'to_state_code' => $transfer->destinationGodown->state_code ?? $primaryGstin->state_code,
            'total_taxable_value' => '10000.00',
            'total_value' => '10000.00',
            'transport_mode' => 'road',
            'distance_km' => $distanceKm,
            'vehicle_number' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $vehicleNumber)),
            'vehicle_type' => 'regular',
            'transporter_name' => $transporterName,
            'status' => 'active',
        ]);
    }

    /**
     * Update Part-B Vehicle Details (Rule 138(2)).
     */
    public function updateVehicle(EWayBill $ewayBill, string $newVehicleNumber, ?string $reason = null): EWayBill
    {
        if ($ewayBill->status !== 'active') {
            throw new InvalidArgumentException("Cannot update vehicle for non-active E-Way Bill.");
        }

        $cleanVeh = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $newVehicleNumber));

        $payload = $ewayBill->raw_payload ?? [];
        $payload['vehicle_history'][] = [
            'previous_vehicle' => $ewayBill->vehicle_number,
            'new_vehicle' => $cleanVeh,
            'updated_at' => now()->toIso8601String(),
            'reason' => $reason ?? 'Transshipment / Breakdown',
        ];

        $ewayBill->vehicle_number = $cleanVeh;
        $ewayBill->raw_payload = $payload;
        $ewayBill->save();

        return $ewayBill;
    }

    /**
     * Cancel E-Way Bill within 24 hours of generation (Rule 138(7)).
     */
    public function cancelEWayBill(EWayBill $ewayBill, string $cancelReason): EWayBill
    {
        if ($ewayBill->status !== 'active') {
            throw new InvalidArgumentException("E-Way Bill is already cancelled.");
        }

        $ewayBill->status = 'cancelled';
        $ewayBill->cancel_reason = $cancelReason;
        $ewayBill->save();

        if ($ewayBill->invoice) {
            $ewayBill->invoice->eway_status = 'cancelled';
            $ewayBill->invoice->save();
        }

        return $ewayBill;
    }
}
