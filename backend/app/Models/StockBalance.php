<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBalance extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'business_id',
        'godown_id',
        'product_id',
        'batch_number',
        'quantity',
        'unit_cost',
        'valuation_method',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_cost' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function godown()
    {
        return $this->belongsTo(Godown::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

