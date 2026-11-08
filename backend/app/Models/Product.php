<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $appends = ['gst_rate'];

    public function getGstRateAttribute()
    {
        return (float) ($this->taxCategory?->igst_rate ?? 18.0);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function taxCategory()
    {
        return $this->belongsTo(TaxCategory::class);
    }
}
