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
        // 1. Add E-Invoice & E-Way Bill attributes to invoices table
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('irn', 64)->nullable()->index()->after('source_metadata');
            $table->string('ack_no', 50)->nullable()->after('irn');
            $table->timestamp('ack_date')->nullable()->after('ack_no');
            $table->text('signed_qr_code')->nullable()->after('ack_date');
            $table->string('einvoice_status', 20)->default('not_applicable')->after('signed_qr_code'); // not_applicable, generated, cancelled, failed
            $table->string('einvoice_cancel_reason')->nullable()->after('einvoice_status');

            $table->string('eway_bill_no', 50)->nullable()->index()->after('einvoice_cancel_reason');
            $table->timestamp('eway_bill_date')->nullable()->after('eway_bill_no');
            $table->timestamp('eway_valid_until')->nullable()->after('eway_bill_date');
            $table->string('eway_status', 20)->default('not_generated')->after('eway_valid_until'); // not_generated, generated, cancelled
        });

        // 2. Dedicated E-Way Bills table (Rule 138 compliance for Invoices, Stock Transfers, Job Work)
        Schema::create('eway_bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('business_gstin_id')->constrained('business_gstins')->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignUuid('stock_transfer_id')->nullable()->constrained('stock_transfers')->nullOnDelete();

            $table->string('eway_bill_no', 50)->unique();
            $table->timestamp('eway_bill_date');
            $table->timestamp('valid_until');

            $table->string('supply_type', 10)->default('outward'); // outward, inward
            $table->string('sub_supply_type', 30)->default('supply'); // supply, export, job_work, skd_ckd, recipient_not_known, for_own_use, exhibition, line_sales, others
            $table->string('doc_type', 20)->default('invoice'); // invoice, bill_of_supply, delivery_challan, credit_note
            $table->string('doc_number', 50);
            $table->date('doc_date');

            // Dispatch / From Address
            $table->string('from_gstin', 15)->nullable();
            $table->string('from_trade_name');
            $table->text('from_address');
            $table->string('from_place');
            $table->string('from_pincode', 6);
            $table->string('from_state_code', 2);

            // Destination / To Address
            $table->string('to_gstin', 15)->nullable();
            $table->string('to_trade_name');
            $table->text('to_address');
            $table->string('to_place');
            $table->string('to_pincode', 6);
            $table->string('to_state_code', 2);

            // Monetary breakdown
            $table->decimal('total_taxable_value', 15, 2);
            $table->decimal('cgst_value', 15, 2)->default(0);
            $table->decimal('sgst_value', 15, 2)->default(0);
            $table->decimal('igst_value', 15, 2)->default(0);
            $table->decimal('cess_value', 15, 2)->default(0);
            $table->decimal('total_value', 15, 2);

            // Transport Details (Part-B)
            $table->string('transporter_id', 15)->nullable();
            $table->string('transporter_name')->nullable();
            $table->string('trans_doc_no', 50)->nullable();
            $table->date('trans_doc_date')->nullable();
            $table->string('transport_mode', 10)->default('road'); // road, rail, air, ship
            $table->unsignedInteger('distance_km')->default(1);
            $table->string('vehicle_number', 20)->nullable();
            $table->string('vehicle_type', 20)->default('regular'); // regular, over_dimensional_cargo

            $table->string('status', 20)->default('active'); // active, cancelled, extended
            $table->string('cancel_reason')->nullable();
            $table->json('raw_payload')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('eway_bills');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'irn',
                'ack_no',
                'ack_date',
                'signed_qr_code',
                'einvoice_status',
                'einvoice_cancel_reason',
                'eway_bill_no',
                'eway_bill_date',
                'eway_valid_until',
                'eway_status',
            ]);
        });
    }
};

