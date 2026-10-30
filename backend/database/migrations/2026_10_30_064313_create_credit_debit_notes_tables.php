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
        Schema::create('credit_debit_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('business_gstin_id')->constrained('business_gstins')->cascadeOnDelete();
            $table->foreignUuid('original_invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('note_type'); // credit_note, debit_note
            $table->string('note_number', 50)->index();
            $table->date('note_date');
            $table->string('reason'); // sales_return, post_sale_discount, deficiency_in_service, correction
            $table->decimal('taxable_value', 15, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('igst_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('finalized');
            $table->timestamps();

            $table->unique(['business_gstin_id', 'note_number'], 'gstin_note_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_debit_notes');
    }
};
