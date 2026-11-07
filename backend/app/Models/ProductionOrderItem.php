<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'production_order_id',
        'raw_material_id',
        'planned_quantity',
        'consumed_quantity',
        'scrap_quantity',
        'unit_cost',
    ];

    protected $casts = [
        'planned_quantity' => 'decimal:4',
        'consumed_quantity' => 'decimal:4',
        'scrap_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:2',
    ];

    public function productionOrder()
    {
        return $this->belongsTo(ProductionOrder::class, 'production_order_id');
    }

    public function rawMaterial()
    {
        return $this->belongsTo(Product::class, 'raw_material_id');
    }
}

