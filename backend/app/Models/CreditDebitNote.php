<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditDebitNote extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'credit_debit_notes';

    protected $fillable = [
        'business_id',
        'business_gstin_id',
        'original_invoice_id',
        'note_type',
        'note_number',
        'note_date',
        'reason',
        'taxable_value',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'total_amount',
        'status',
    ];

    protected $casts = [
        'note_date' => 'date',
        'taxable_value' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function businessGstin()
    {
        return $this->belongsTo(BusinessGstin::class);
    }

    public function originalInvoice()
    {
        return $this->belongsTo(Invoice::class, 'original_invoice_id');
    }
}

