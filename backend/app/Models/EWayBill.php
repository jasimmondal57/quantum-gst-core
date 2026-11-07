<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EWayBill extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'eway_bills';

    protected $fillable = [
        'business_id',
        'business_gstin_id',
        'invoice_id',
        'stock_transfer_id',
        'eway_bill_no',
        'eway_bill_date',
        'valid_until',
        'supply_type',
        'sub_supply_type',
        'doc_type',
        'doc_number',
        'doc_date',
        'from_gstin',
        'from_trade_name',
        'from_address',
        'from_place',
        'from_pincode',
        'from_state_code',
        'to_gstin',
        'to_trade_name',
        'to_address',
        'to_place',
        'to_pincode',
        'to_state_code',
        'total_taxable_value',
        'cgst_value',
        'sgst_value',
        'igst_value',
        'cess_value',
        'total_value',
        'transporter_id',
        'transporter_name',
        'trans_doc_no',
        'trans_doc_date',
        'transport_mode',
        'distance_km',
        'vehicle_number',
        'vehicle_type',
        'status',
        'cancel_reason',
        'raw_payload',
    ];

    protected $casts = [
        'eway_bill_date' => 'datetime',
        'valid_until' => 'datetime',
        'doc_date' => 'date',
        'trans_doc_date' => 'date',
        'total_taxable_value' => 'decimal:2',
        'cgst_value' => 'decimal:2',
        'sgst_value' => 'decimal:2',
        'igst_value' => 'decimal:2',
        'cess_value' => 'decimal:2',
        'total_value' => 'decimal:2',
        'distance_km' => 'integer',
        'raw_payload' => 'array',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function businessGstin()
    {
        return $this->belongsTo(BusinessGstin::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function stockTransfer()
    {
        return $this->belongsTo(StockTransfer::class);
    }
}

