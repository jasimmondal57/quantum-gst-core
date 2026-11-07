<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Allow sequence numbers for non-GST documents (journal entries, vouchers, etc.)
        Schema::table('invoice_sequences', function (Blueprint $table) {
            $table->uuid('business_gstin_id')->nullable()->change();
        });

        // 1. Chart of Accounts (COA)
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('code', 50)->index();
            $table->string('name');
            $table->string('type'); // asset, liability, equity, revenue, expense
            $table->string('sub_type'); // cash, bank, accounts_receivable, current_asset, accounts_payable, statutory_tax_payable, statutory_itc_receivable, equity, operating_revenue, operating_expense, direct_expense
            $table->string('currency', 3)->default('INR');
            $table->boolean('is_system')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['business_id', 'code'], 'biz_account_code_unique');
        });

        // 2. Double-Entry Journal Entries
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('entry_number', 50)->index();
            $table->date('entry_date');
            $table->string('reference_type')->nullable(); // invoice, credit_note, debit_note, payment, manual
            $table->uuid('reference_id')->nullable()->index();
            $table->text('narration')->nullable();
            $table->decimal('total_debit', 15, 2)->default(0);
            $table->decimal('total_credit', 15, 2)->default(0);
            $table->string('status')->default('posted'); // posted, draft, reversed
            $table->timestamps();

            $table->unique(['business_id', 'entry_number'], 'biz_journal_entry_unique');
        });

        // 3. Journal Entry Lines (Debits & Credits)
        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignUuid('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('party_type')->nullable(); // customer, supplier
            $table->uuid('party_id')->nullable()->index();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 4. Payment Vouchers (Receipts, Payments, Contra)
        Schema::create('payment_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('voucher_number', 50)->index();
            $table->string('voucher_type'); // receipt, payment, contra
            $table->date('voucher_date');
            $table->foreignUuid('bank_cash_account_id')->constrained('accounts');
            $table->foreignUuid('party_account_id')->constrained('accounts');
            $table->string('party_type')->nullable(); // customer, supplier, other
            $table->uuid('party_id')->nullable()->index();
            $table->decimal('amount', 15, 2);
            $table->string('payment_mode')->default('bank_transfer'); // bank_transfer, upi, card, cash, cheque
            $table->string('reference_number')->nullable();
            $table->uuid('reference_invoice_id')->nullable()->index();
            $table->text('narration')->nullable();
            $table->string('status')->default('settled'); // settled, pending, cancelled
            $table->timestamps();

            $table->unique(['business_id', 'voucher_number'], 'biz_voucher_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_vouchers');
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('accounts');
    }
};
