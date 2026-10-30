<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessGstin extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function sequences()
    {
        return $this->hasMany(InvoiceSequence::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
