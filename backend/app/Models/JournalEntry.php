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

    protected static function booted()
    {
        static::updating(function ($entry) {
            if ($entry->getOriginal('status') === 'posted') {
                if ($entry->isDirty(['business_id', 'entry_number', 'total_debit', 'total_credit', 'entry_date'])) {
                    throw new \RuntimeException('Posted journal entries are statutory records and cannot be altered. Post a reversal or adjusting entry instead.');
                }
            }
        });

        static::deleting(function ($entry) {
            if ($entry->status === 'posted') {
                throw new \RuntimeException('Posted journal entries cannot be deleted. Create a reversal entry instead.');
            }
        });
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}

