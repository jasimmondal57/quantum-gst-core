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
        // 1. Purchase Bills (Inward Supplies / Vendor Bills)
        Schema::create('purchase_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('business_gstin_id')->constrained('business_gstins')->cascadeOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignUuid('godown_id')->nullable()->constrained('godowns')->nullOnDelete();

            $table->string('bill_number', 50)->index();
            $table->date('bill_date');
            $table->date('due_date')->nullable();
            $table->string('bill_type', 30)->default('purchase_bill'); // purchase_bill, import, reverse_charge
            $table->string('status', 20)->default('received'); // received, paid, partially_paid, cancelled

            // Place of Supply & Tax Treatment
            $table->string('place_of_supply_state_code', 2);
            $table->boolean('is_interstate')->default(false);
            $table->boolean('reverse_charge')->default(false);
            $table->string('itc_eligibility', 20)->default('inputs'); // inputs, capital_goods, input_services, ineligible

            // Monetary Totals
            $table->decimal('total_taxable_value', 15, 2)->default(0);
            $table->decimal('total_cgst', 15, 2)->default(0);
            $table->decimal('total_sgst', 15, 2)->default(0);
            $table->decimal('total_igst', 15, 2)->default(0);
            $table->decimal('total_cess', 15, 2)->default(0);
            $table->decimal('total_tax_amount', 15, 2)->default(0);
            $table->decimal('round_off', 6, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_gstin_id', 'supplier_id', 'bill_number'], 'biz_supplier_bill_unique');
        });

        // 2. Purchase Bill Line Items
        Schema::create('purchase_bill_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_bill_id')->constrained('purchase_bills')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('item_name');
            $table->string('hsn_sac', 8);
            $table->decimal('quantity', 12, 4)->default(1);
            $table->string('unit', 10)->default('NOS');
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('taxable_value', 15, 2)->default(0);

            $table->decimal('cgst_rate', 5, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_rate', 5, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('igst_rate', 5, 2)->default(0);
            $table->decimal('igst_amount', 15, 2)->default(0);
            $table->decimal('cess_amount', 15, 2)->default(0);

            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_bill_items');
        Schema::dropIfExists('purchase_bills');
    }
};

