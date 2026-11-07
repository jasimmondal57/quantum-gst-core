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
        // 1. Godowns / Warehouses Master
        Schema::create('godowns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('code', 50)->index();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('state_code', 2)->nullable();
            $table->string('state_name')->nullable();
            $table->string('pincode', 6)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'code'], 'biz_godown_code_unique');
        });

        // 2. Stock Balances by Godown and Product
        Schema::create('stock_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('godown_id')->constrained('godowns')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('batch_number', 50)->nullable();
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->string('valuation_method')->default('weighted_average'); // fifo, weighted_average
            $table->timestamps();

            $table->index(['business_id', 'godown_id', 'product_id'], 'biz_stock_idx');
        });

        // 3. Bill of Materials (BOM)
        Schema::create('bill_of_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('finished_good_id')->constrained('products')->cascadeOnDelete();
            $table->string('bom_number', 50)->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('output_quantity', 15, 4)->default(1);
            $table->string('output_unit', 10)->default('NOS');
            $table->decimal('estimated_labor_cost', 15, 2)->default(0);
            $table->decimal('estimated_overhead_cost', 15, 2)->default(0);
            $table->string('status')->default('active'); // active, draft, archived
            $table->timestamps();

            $table->unique(['business_id', 'bom_number'], 'biz_bom_number_unique');
        });

        // 4. BOM Component / Raw Material Items
        Schema::create('bom_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bom_id')->constrained('bill_of_materials')->cascadeOnDelete();
            $table->foreignUuid('raw_material_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->string('unit', 10)->default('NOS');
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('estimated_wastage_percent', 5, 2)->default(0);
            $table->timestamps();
        });

        // 5. Production Orders
        Schema::create('production_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('bom_id')->constrained('bill_of_materials')->cascadeOnDelete();
            $table->foreignUuid('finished_good_id')->constrained('products')->cascadeOnDelete();
            $table->string('order_number', 50)->index();
            $table->foreignUuid('source_godown_id')->constrained('godowns');
            $table->foreignUuid('target_godown_id')->constrained('godowns');
            $table->decimal('planned_quantity', 15, 4);
            $table->decimal('completed_quantity', 15, 4)->default(0);
            $table->decimal('wasted_quantity', 15, 4)->default(0);
            $table->string('batch_number', 50)->nullable();
            $table->date('start_date');
            $table->date('completion_date')->nullable();
            $table->decimal('actual_labor_cost', 15, 2)->default(0);
            $table->decimal('actual_overhead_cost', 15, 2)->default(0);
            $table->decimal('total_production_cost', 15, 2)->default(0);
            $table->string('status')->default('draft'); // draft, in_progress, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'order_number'], 'biz_prod_order_unique');
        });

        // 6. Production Order Actual Consumption Items
        Schema::create('production_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('production_order_id')->constrained('production_orders')->cascadeOnDelete();
            $table->foreignUuid('raw_material_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('planned_quantity', 15, 4);
            $table->decimal('consumed_quantity', 15, 4)->default(0);
            $table->decimal('scrap_quantity', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->timestamps();
        });

        // 7. Stock Transfers (Inter-godown / Job Work)
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('transfer_number', 50)->index();
            $table->foreignUuid('source_godown_id')->constrained('godowns');
            $table->foreignUuid('destination_godown_id')->constrained('godowns');
            $table->date('transfer_date');
            $table->string('delivery_challan_number', 50)->nullable();
            $table->string('status')->default('dispatched'); // dispatched, received, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'transfer_number'], 'biz_transfer_num_unique');
        });

        // 8. Stock Transfer Line Items
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_transfer_id')->constrained('stock_transfers')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->string('unit', 10)->default('NOS');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('production_order_items');
        Schema::dropIfExists('production_orders');
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('bill_of_materials');
        Schema::dropIfExists('stock_balances');
        Schema::dropIfExists('godowns');
    }
};

