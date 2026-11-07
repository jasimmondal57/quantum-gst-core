<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentVoucher extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'business_id',
        'voucher_number',
        'voucher_type',
        'voucher_date',
        'bank_cash_account_id',
        'party_account_id',
        'party_type',
        'party_id',
        'amount',
        'payment_mode',
        'reference_number',
        'reference_invoice_id',
        'narration',
        'status',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function bankCashAccount()
    {
        return $this->belongsTo(Account::class, 'bank_cash_account_id');
    }

    public function partyAccount()
    {
        return $this->belongsTo(Account::class, 'party_account_id');
    }
}
