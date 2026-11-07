<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketplaceConnection extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'credentials' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function orders()
    {
        return $this->hasMany(MarketplaceOrder::class);
    }
}
