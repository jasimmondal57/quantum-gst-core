<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseBill extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'business_id',
        'business_gstin_id',
        'supplier_id',
        'godown_id',
        'bill_number',
        'bill_date',
        'due_date',
        'bill_type',
        'status',
        'place_of_supply_state_code',
        'is_interstate',
        'reverse_charge',
        'itc_eligibility',
        'total_taxable_value',
        'total_cgst',
        'total_sgst',
        'total_igst',
        'total_cess',
        'total_tax_amount',
        'round_off',
        'grand_total',
        'paid_amount',
        'notes',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
        'is_interstate' => 'boolean',
        'reverse_charge' => 'boolean',
        'total_taxable_value' => 'decimal:2',
        'total_cgst' => 'decimal:2',
        'total_sgst' => 'decimal:2',
        'total_igst' => 'decimal:2',
        'total_cess' => 'decimal:2',
        'total_tax_amount' => 'decimal:2',
        'round_off' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function businessGstin()
    {
        return $this->belongsTo(BusinessGstin::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Customer::class, 'supplier_id');
    }

    public function godown()
    {
        return $this->belongsTo(Godown::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseBillItem::class);
    }
}
