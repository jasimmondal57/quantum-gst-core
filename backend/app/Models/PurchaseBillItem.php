<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseBillItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'purchase_bill_id',
        'product_id',
        'item_name',
        'hsn_sac',
        'quantity',
        'unit',
        'unit_price',
        'discount_amount',
        'taxable_value',
        'cgst_rate',
        'cgst_amount',
        'sgst_rate',
        'sgst_amount',
        'igst_rate',
        'igst_amount',
        'cess_amount',
        'total_amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_value' => 'decimal:2',
        'cgst_rate' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_rate' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_rate' => 'decimal:2',
        'igst_amount' => 'decimal:2',
        'cess_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function purchaseBill()
    {
        return $this->belongsTo(PurchaseBill::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
