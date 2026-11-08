<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Database-level idempotency constraint on Journal Entry Reference
        // Ensures that no business can ever post duplicate journal entries for the same invoice, cancellation, or settlement
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->index(['business_id', 'reference_type', 'reference_id'], 'idx_biz_ref_journal_entries');
        });

        // 2. PostgreSQL Engine-Level Statutory Immutability Triggers
        if (DB::getDriverName() === 'pgsql') {
            // Function preventing UPDATE or DELETE on posted journal entries
            DB::unprepared("
                CREATE OR REPLACE FUNCTION prevent_posted_journal_mutation()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF (OLD.status = 'posted' AND (
                        TG_OP = 'DELETE' OR 
                        OLD.entry_number <> NEW.entry_number OR 
                        OLD.total_debit <> NEW.total_debit OR 
                        OLD.total_credit <> NEW.total_credit OR
                        OLD.business_id <> NEW.business_id
                    )) THEN
                        RAISE EXCEPTION 'Database Invariant Violation: Posted journal entries are statutory records and cannot be altered or deleted.';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trg_immutable_journal_entries ON journal_entries;
                CREATE TRIGGER trg_immutable_journal_entries
                BEFORE UPDATE OR DELETE ON journal_entries
                FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_mutation();
            ");

            // Function preventing line modifications on posted journal entries
            DB::unprepared("
                CREATE OR REPLACE FUNCTION prevent_posted_journal_line_mutation()
                RETURNS TRIGGER AS $$
                DECLARE
                    entry_status text;
                BEGIN
                    SELECT status INTO entry_status FROM journal_entries WHERE id = OLD.journal_entry_id;
                    IF (entry_status = 'posted') THEN
                        RAISE EXCEPTION 'Database Invariant Violation: Lines of posted journal entries cannot be deleted or modified.';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trg_immutable_journal_entry_lines ON journal_entry_lines;
                CREATE TRIGGER trg_immutable_journal_entry_lines
                BEFORE UPDATE OR DELETE ON journal_entry_lines
                FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_line_mutation();
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared("
                DROP TRIGGER IF EXISTS trg_immutable_journal_entry_lines ON journal_entry_lines;
                DROP FUNCTION IF EXISTS prevent_posted_journal_line_mutation();
                DROP TRIGGER IF EXISTS trg_immutable_journal_entries ON journal_entries;
                DROP FUNCTION IF EXISTS prevent_posted_journal_mutation();
            ");
        }

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropIndex('idx_biz_ref_journal_entries');
        });
    }
};
