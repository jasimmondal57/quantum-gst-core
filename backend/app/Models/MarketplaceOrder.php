<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketplaceOrder extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'order_date' => 'date',
        'order_total' => 'decimal:2',
        'raw_payload' => 'array',
    ];

    public function marketplaceConnection()
    {
        return $this->belongsTo(MarketplaceConnection::class);
    }
}
