<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'business_id',
        'entry_number',
        'entry_date',
        'reference_type',
        'reference_id',
        'narration',
        'total_debit',
        'total_credit',
        'status',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'total_debit' => 'decimal:2',
        'total_credit' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}

