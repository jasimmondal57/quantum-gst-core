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
        // 1. Organizations (Multi-tenant root)
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active');
            $table->string('timezone')->default('Asia/Kolkata');
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Organization Users (Pivot for membership & RBAC)
        Schema::create('organization_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('member'); // owner, admin, accountant, staff
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
        });

        // 3. Businesses (Entities under an organization)
        Schema::create('businesses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('legal_name');
            $table->string('trade_name')->nullable();
            $table->string('pan', 10)->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('currency', 3)->default('INR');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Business GSTINs (Multi-GSTIN registrations per business)
        Schema::create('business_gstins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('gstin', 15)->index();
            $table->string('state_code', 2);
            $table->string('state_name');
            $table->string('legal_name');
            $table->string('trade_name')->nullable();
            $table->string('registration_type')->default('regular'); // regular, composition, sez, isd
            $table->text('address_line1')->nullable();
            $table->text('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('pincode', 6)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['business_id', 'gstin']);
        });

        // 5. Tax Categories & Rates
        Schema::create('tax_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // e.g. GST Standard 18%, Exempt, Nil-rated
            $table->decimal('cgst_rate', 6, 3)->default(0);
            $table->decimal('sgst_rate', 6, 3)->default(0);
            $table->decimal('igst_rate', 6, 3)->default(0);
            $table->decimal('cess_rate', 6, 3)->default(0);
            $table->string('supply_type')->default('taxable'); // taxable, nil_rated, exempt, non_gst
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // 6. Products / Services
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('type')->default('goods'); // goods, service
            $table->string('sku')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('hsn_sac', 8)->index();
            $table->foreignUuid('tax_category_id')->nullable()->constrained('tax_categories')->nullOnDelete();
            $table->string('unit', 10)->default('NOS'); // PCS, NOS, KGS, MTR, etc.
            $table->decimal('sale_price', 15, 2)->default(0);
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->boolean('tax_inclusive')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('customer_type')->default('b2b'); // b2b, b2c, export, sez
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('gstin', 15)->nullable()->index();
            $table->string('pan', 10)->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('state_code', 2);
            $table->string('state_name');
            $table->text('billing_address')->nullable();
            $table->string('billing_pincode', 6)->nullable();
            $table->text('shipping_address')->nullable();
            $table->string('shipping_pincode', 6)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 8. Invoice Sequences
        Schema::create('invoice_sequences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('business_gstin_id')->constrained('business_gstins')->cascadeOnDelete();
            $table->string('document_type')->default('invoice'); // invoice, credit_note, debit_note, bill_of_supply
            $table->string('prefix')->default('INV-');
            $table->string('financial_year', 7); // e.g., 2026-27
            $table->unsignedBigInteger('next_number')->default(1);
            $table->timestamps();
            $table->unique(['business_gstin_id', 'document_type', 'prefix', 'financial_year'], 'inv_seq_unique');
        });

        // 9. Invoices (Tax Invoices, Bills of Supply, Exports)
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('business_gstin_id')->constrained('business_gstins')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();

            $table->string('invoice_number', 50)->index();
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->string('invoice_type')->default('tax_invoice'); // tax_invoice, bill_of_supply, export, reverse_charge
            $table->string('status')->default('draft'); // draft, finalized, paid, partially_paid, cancelled

            // Place of Supply & Supply Classification
            $table->string('place_of_supply_state_code', 2);
            $table->boolean('is_interstate')->default(false);
            $table->boolean('reverse_charge')->default(false);

            // Monetary Totals (Precision Decimal)
            $table->decimal('total_taxable_value', 15, 2)->default(0);
            $table->decimal('total_cgst', 15, 2)->default(0);
            $table->decimal('total_sgst', 15, 2)->default(0);
            $table->decimal('total_igst', 15, 2)->default(0);
            $table->decimal('total_cess', 15, 2)->default(0);
            $table->decimal('total_tax_amount', 15, 2)->default(0);
            $table->decimal('round_off', 6, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);

            // Source Tracking (manual, shopify, amazon, meesho, flipkart, api)
            $table->string('source')->default('manual');
            $table->string('external_reference_id')->nullable()->index();
            $table->json('source_metadata')->nullable();

            $table->text('notes')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_gstin_id', 'invoice_number'], 'gstin_inv_num_unique');
        });

        // 10. Invoice Items
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('item_name');
            $table->string('hsn_sac', 8);
            $table->decimal('quantity', 12, 4)->default(1);
            $table->string('unit', 10)->default('NOS');
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);

            $table->decimal('taxable_value', 15, 2)->default(0);
            $table->decimal('cgst_rate', 5, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_rate', 5, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('igst_rate', 5, 2)->default(0);
            $table->decimal('igst_amount', 15, 2)->default(0);
            $table->decimal('cess_rate', 5, 2)->default(0);
            $table->decimal('cess_amount', 15, 2)->default(0);

            $table->decimal('total_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        // 11. Marketplace Integrations & Raw Orders
        Schema::create('marketplace_connections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('channel'); // amazon, flipkart, meesho, shopify
            $table->string('account_name');
            $table->json('credentials')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('marketplace_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('marketplace_connection_id')->constrained('marketplace_connections')->cascadeOnDelete();
            $table->string('channel_order_id')->index();
            $table->timestamp('order_date');
            $table->string('order_status')->default('completed');
            $table->string('customer_name')->nullable();
            $table->string('shipping_state_code', 2)->nullable();
            $table->decimal('order_total', 15, 2)->default(0);
            $table->json('raw_payload')->nullable();
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->string('sync_status')->default('pending'); // pending, invoiced, skipped, failed
            $table->timestamps();

            $table->unique(['marketplace_connection_id', 'channel_order_id'], 'channel_order_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_orders');
        Schema::dropIfExists('marketplace_connections');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('invoice_sequences');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('tax_categories');
        Schema::dropIfExists('business_gstins');
        Schema::dropIfExists('businesses');
        Schema::dropIfExists('organization_users');
        Schema::dropIfExists('organizations');
    }
};
