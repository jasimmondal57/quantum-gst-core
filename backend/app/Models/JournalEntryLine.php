<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntryLine extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'journal_entry_id',
        'account_id',
        'party_type',
        'party_id',
        'debit',
        'credit',
        'description',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::updating(function ($line) {
            if ($line->journalEntry?->status === 'posted') {
                throw new \RuntimeException('Lines of posted journal entries cannot be modified.');
            }
        });

        static::deleting(function ($line) {
            if ($line->journalEntry?->status === 'posted') {
                throw new \RuntimeException('Lines of posted journal entries cannot be deleted.');
            }
        });
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}

