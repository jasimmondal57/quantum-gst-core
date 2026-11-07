<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillOfMaterial extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bill_of_materials';

    protected $fillable = [
        'business_id',
        'finished_good_id',
        'bom_number',
        'name',
        'description',
        'output_quantity',
        'output_unit',
        'estimated_labor_cost',
        'estimated_overhead_cost',
        'status',
    ];

    protected $casts = [
        'output_quantity' => 'decimal:4',
        'estimated_labor_cost' => 'decimal:2',
        'estimated_overhead_cost' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function finishedGood()
    {
        return $this->belongsTo(Product::class, 'finished_good_id');
    }

    public function items()
    {
        return $this->hasMany(BomItem::class, 'bom_id');
    }
}
