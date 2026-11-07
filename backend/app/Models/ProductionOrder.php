<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'business_id',
        'bom_id',
        'finished_good_id',
        'order_number',
        'source_godown_id',
        'target_godown_id',
        'planned_quantity',
        'completed_quantity',
        'wasted_quantity',
        'batch_number',
        'start_date',
        'completion_date',
        'actual_labor_cost',
        'actual_overhead_cost',
        'total_production_cost',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'completion_date' => 'date',
        'planned_quantity' => 'decimal:4',
        'completed_quantity' => 'decimal:4',
        'wasted_quantity' => 'decimal:4',
        'actual_labor_cost' => 'decimal:2',
        'actual_overhead_cost' => 'decimal:2',
        'total_production_cost' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function bom()
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function finishedGood()
    {
        return $this->belongsTo(Product::class, 'finished_good_id');
    }

    public function sourceGodown()
    {
        return $this->belongsTo(Godown::class, 'source_godown_id');
    }

    public function targetGodown()
    {
        return $this->belongsTo(Godown::class, 'target_godown_id');
    }

    public function items()
    {
        return $this->hasMany(ProductionOrderItem::class, 'production_order_id');
    }
}

