<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxCategory extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'cgst_rate' => 'decimal:2',
        'sgst_rate' => 'decimal:2',
        'igst_rate' => 'decimal:2',
        'cess_rate' => 'decimal:2',
        'is_system' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
