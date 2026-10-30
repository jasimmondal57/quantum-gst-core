# Quantum GST – Complete Technical Implementation Blueprint



Technical architecture approved

Multi-tenant SaaS



Quantum GST will be a cloud-based Indian GST billing, accounting, marketplace reconciliation and eCommerce automation platform, developed using Laravel, React and PostgreSQL.

The first release will focus on three major capabilities:

1. Complete GST billing and business management.
2. Marketplace report imports for Amazon, Meesho, Flipkart and other platforms.
3. Shopify integration and a public API for automated GST invoice generation.

The architecture will also support future GSP integration, e-invoicing, e-way bills, GST return preparation, accountant portals and custom website connectors without requiring a major rewrite.

## 1. Project definition

# Quantum GST

GST Billing · Accounting · Marketplace Automation

SaaS product

| Configuration        | Selection                        |
| -------------------- | -------------------------------- |
| Product              | Quantum GST                      |
| Backend              | Laravel                          |
| Frontend             | React + TypeScript               |
| Database             | PostgreSQL                       |
| Cache / Queue        | Redis                            |
| Deployment           | Multi-tenant SaaS                |
| Target market        | All Indian business types        |
| GST integration      | Preparation + GSP                |
| Commerce integration | Shopify + marketplace connectors |
| API                  | Versioned REST API               |
| Storage              | Cloudflare R2 / S3               |

### Product positioning

Quantum GST – One platform for billing, GST compliance and eCommerce automation.

The application should support:

- Retailers and wholesalers.
- Manufacturers and distributors.
- Service providers.
- eCommerce sellers.
- Marketplace sellers.
- Multi-GSTIN businesses.
- Accountants and CA firms.
- Businesses operating multiple online stores.

# 2. System architecture

I recommend a modular monolith for the first release, with independent integration workers.

Do not start with 15 microservices. That will increase deployment, monitoring and development complexity. Laravel modules can keep business logic isolated while allowing future extraction into services.

## Quantum GST architecture

React frontend

Business dashboard · Admin panel · Developer portal · Accountant portal

Laravel API Gateway

Authentication · Tenant resolution · Permissions · Validation · Rate limiting

Core business modules

BillingGST EngineAccountingInventoryReports

Integration modules

Marketplace importsShopifyPublic APIWebhooksGSP adapters

PostgreSQL

Transactional data

Redis + Horizon

Jobs and caching

R2 / S3

Files and documents

Audit / Monitoring

Logs and alerts

External integrations

Shopify · Amazon · Meesho · Flipkart · GSTN/GSP · IRP · Payment gateways

## Architecture decisions

| Component        | Decision                  |
| ---------------- | ------------------------- |
| Backend          | Laravel modular monolith  |
| API              | REST `/api/v1`            |
| Frontend         | React + TypeScript        |
| Authentication   | Laravel Sanctum           |
| External OAuth   | OAuth2 where required     |
| Queue            | Redis + Horizon           |
| Database         | PostgreSQL                |
| Search           | PostgreSQL initially      |
| File storage     | R2/S3 private buckets     |
| PDF              | Browsershot               |
| Excel            | Laravel Excel / OpenSpout |
| Documentation    | OpenAPI / Swagger         |
| Deployment       | Docker + Nginx            |
| Error monitoring | Sentry                    |
| Testing          | Pest / PHPUnit + Vitest   |

Use a maintained Laravel release supported at project commencement and lock dependency versions. Do not hardcode a Laravel version into the product architecture.

# 3. Laravel application module structure

Use domain-based modules instead of putting all application logic into `app/Http/Controllers`.

I recommend using Laravel's standard application structure with domain modules under `app/Modules`.

## 3.1 Folder structure

```
quantum-gst/
│
├── app/
│   ├── Core/
│   │   ├── Tenancy/
│   │   ├── Security/
│   │   ├── Exceptions/
│   │   ├── Money/
│   │   ├── Events/
│   │   └── Support/
│   │
│   ├── Modules/
│   │   ├── Identity/
│   │   ├── Organization/
│   │   ├── Business/
│   │   ├── GSTRegistration/
│   │   ├── Product/
│   │   ├── Customer/
│   │   ├── Supplier/
│   │   ├── GSTEngine/
│   │   ├── Billing/
│   │   ├── CreditDebitNotes/
│   │   ├── Purchase/
│   │   ├── Inventory/
│   │   ├── Accounting/
│   │   ├── Payment/
│   │   ├── Marketplace/
│   │   ├── Reconciliation/
│   │   ├── Integration/
│   │   ├── Shopify/
│   │   ├── DeveloperAPI/
│   │   ├── GSTReports/
│   │   ├── GSTReturns/
│   │   ├── EInvoice/
│   │   ├── EWayBill/
│   │   ├── Subscription/
│   │   └── Notification/
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   │
│   ├── Jobs/
│   ├── Listeners/
│   ├── Policies/
│   └── Providers/
│
├── bootstrap/
├── config/
│   ├── quantum_gst.php
│   ├── gst.php
│   ├── marketplaces.php
│   └── integrations.php
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
│
├── resources/
│   └── views/
│       └── invoices/
│
├── routes/
│   ├── api.php
│   ├── web.php
│   └── console.php
│
├── tests/
│   ├── Unit/
│   ├── Feature/
│   ├── Integration/
│   └── Compliance/
│
├── storage/
├── docker/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── gst/
│   └── connectors/
│
└── composer.json
```

## 3.2 Standard module structure

Every major module should follow a consistent pattern.

For example:

```
app/Modules/Billing/
│
├── Controllers/
│   └── InvoiceController.php
│
├── Models/
│   ├── Invoice.php
│   └── InvoiceItem.php
│
├── Services/
│   ├── InvoiceService.php
│   ├── InvoiceNumberService.php
│   └── InvoicePdfService.php
│
├── Actions/
│   ├── CreateInvoice.php
│   ├── FinalizeInvoice.php
│   └── CancelInvoice.php
│
├── DTOs/
│   ├── InvoiceData.php
│   └── InvoiceItemData.php
│
├── Events/
│   ├── InvoiceCreated.php
│   └── InvoiceFinalized.php
│
├── Listeners/
├── Policies/
├── Requests/
├── Resources/
└── Validators/
```

### Critical separation of responsibilities

- Controllers: HTTP request and response.
- Services: Business orchestration.
- Actions: Individual business operations.
- DTOs: Typed input and output.
- Models: Database persistence and relationships.
- Events: Business events.
- Jobs: Background processing.
- Validators: Business and compliance validation.

For example, `CreateInvoice` should not be responsible for Shopify authentication, marketplace file parsing or PDF delivery. It should create a valid invoice using the shared billing and GST services.

# 4. PostgreSQL database design

This is the most important technical section.

I recommend a shared PostgreSQL database with tenant isolation using `organization_id`, business-level isolation using `business_id`, and GST registration-level isolation using `gstin_id`.

Use PostgreSQL Row-Level Security (RLS) as an additional protection layer for tenant-owned tables, alongside Laravel authorization and query scoping.

## 4.1 Entity relationship overview

\#chatgpt-mermaid-\_r_ti\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_ti\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_ti\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_ti\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_ti\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ti\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_ti\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_ti\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_ti\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_ti\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_ti\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_ti\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_ti\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_ti\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_ti\_ p{margin:0;}#chatgpt-mermaid-\_r_ti\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_ti\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_ti\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_ti\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_ti\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_ti\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_ti\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ti\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_ti\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ti\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_ti\_ .node rect,#chatgpt-mermaid-\_r_ti\_ .node circle,#chatgpt-mermaid-\_r_ti\_ .node ellipse,#chatgpt-mermaid-\_r_ti\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_ti\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_ti\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_ti\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_ti\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_ti\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_ti\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_ti\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_ti\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ti\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_ti\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ti\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}USERSORGANIZATION_USERSORGANIZATIONSBUSINESSESBUSINESS_GSTINSCUSTOMERSSUPPLIERSPRODUCTSINVOICESINVOICE_ITEMSINVOICE_TAXESMARKETPLACE_CONNECTIONSMARKETPLACE_IMPORTSMARKETPLACE_ORDERSMARKETPLACE_ORDER_ITEMSSTORE_CONNECTIONSWEBHOOK_EVENTSAPI_KEYSJOURNAL_ENTRIESJOURNAL_ENTRY_LINESbelongshasownsregistersmanagesmanagesmanagesissuesreceivescontainscalculatesconnectsimportscontainscontainsconnectsreceivesownsrecordscontains

## 4.2 Database conventions

Use these conventions throughout:

| Field            | Type                        |
| ---------------- | --------------------------- |
| Primary ID       | UUID                        |
| Organization ID  | UUID                        |
| Business ID      | UUID                        |
| GSTIN ID         | UUID                        |
| Currency         | CHAR(3)                     |
| Monetary values  | NUMERIC(20,2)               |
| Tax rates        | NUMERIC(8,4)                |
| Quantities       | NUMERIC(20,4)               |
| External IDs     | VARCHAR                     |
| Dates            | DATE                        |
| Event timestamps | TIMESTAMPTZ                 |
| Status           | VARCHAR or constrained enum |

Use UUIDs for public identifiers, and separate internal auto-increment IDs only if performance profiling justifies them.

All money calculations should use decimal arithmetic. Never use PHP floating-point arithmetic for GST calculations.

## 4.3 Core database tables

### A. Identity and tenancy

| Table              | Important columns                                         |
| ------------------ | --------------------------------------------------------- |
| users              | id, name, email, mobile, password                         |
| organizations      | id, name, slug, status, timezone                          |
| organization_users | organization_id, user_id, status                          |
| roles              | id, organization_id, name                                 |
| permissions        | id, key, description                                      |
| role_permissions   | role_id, permission_id                                    |
| user_roles         | user_id, organization_id, role_id                         |
| businesses         | id, organization_id, legal_name, trade_name               |
| business_addresses | business_id, address_type, state_code                     |
| business_gstins    | business_id, gstin, registration_type, state_code, status |

### B. Product and parties

| Table                | Important columns                           |
| -------------------- | ------------------------------------------- |
| products             | id, business_id, sku, name, hsn_sac_id      |
| product_variants     | id, product_id, sku, attributes             |
| product_tax_profiles | product_id, tax_category_id, effective_from |
| hsn_sac_codes        | code, description, classification           |
| tax_categories       | id, name, supply_type                       |
| customers            | id, business_id, name, gstin, customer_type |
| customer_addresses   | customer_id, state_code, address_type       |
| suppliers            | id, business_id, name, gstin                |
| units                | id, code, name                              |

### C. GST master and rules

| Table                      | Important columns                                       |
| -------------------------- | ------------------------------------------------------- |
| gst_tax_rates              | id, tax_category_id, rate, effective_from, effective_to |
| gst_rule_versions          | id, rule_code, version, effective_from                  |
| gst_supply_classifications | id, code, description                                   |
| gst_state_codes            | code, state_name                                        |
| gst_place_of_supply_rules  | id, rule_code, conditions                               |
| gst_exemptions             | id, exemption_code, effective_from                      |
| gst_cess_rates             | id, tax_category_id, cess_type, rate                    |

Important: Store tax rules as effective-dated records. A historical invoice must remain reproducible using the rules applied when it was issued.

Do not let an administrator edit an old tax rate and accidentally change previously issued invoices.

### D. Sales and purchase

| Table                | Important columns                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| invoices             | id, organization_id, business_id, gstin_id, invoice_number, invoice_date |
| invoice_items        | invoice_id, product_id, hsn, qty, taxable_value                          |
| invoice_taxes        | invoice_item_id, tax_type, rate, amount                                  |
| invoice_sequences    | business_id, gstin_id, series, financial_year, next_number               |
| credit_notes         | id, original_invoice_id, credit_note_number                              |
| credit_note_items    | credit_note_id, invoice_item_id, taxable_value                           |
| debit_notes          | id, original_invoice_id, debit_note_number                               |
| purchases            | id, supplier_id, invoice_number, invoice_date                            |
| purchase_items       | purchase_id, product_id, hsn, taxable_value                              |
| purchase_taxes       | purchase_item_id, tax_type, rate, amount                                 |
| payment_transactions | id, business_id, invoice_id, amount, method                              |
| expenses             | id, business_id, category_id, amount, gstin_id                           |

### E. Accounting

| Table               | Important columns                                 |
| ------------------- | ------------------------------------------------- |
| accounts            | id, business_id, account_code, name, account_type |
| journal_entries     | id, business_id, voucher_number, entry_date       |
| journal_entry_lines | journal_entry_id, account_id, debit, credit       |
| fiscal_periods      | business_id, financial_year, start_date, end_date |
| bank_accounts       | id, business_id, bank_name, account_reference     |
| bank_transactions   | bank_account_id, transaction_date, amount         |
| ledger_entries      | business_id, account_id, journal_entry_line_id    |

Use double-entry bookkeeping. Every posted journal entry must balance:

\\[ \sum Debit = \sum Credit \\]

Draft accounting entries may be edited; posted entries should be corrected using reversal and replacement entries.

### F. Marketplace

| Table                       | Important columns                                   |
| --------------------------- | --------------------------------------------------- |
| marketplaces                | id, code, name                                      |
| marketplace_connections     | id, organization_id, business_id, marketplace_id    |
| marketplace_imports         | id, connection_id, file_id, report_type, status     |
| marketplace_raw_records     | id, import_id, row_number, raw_data                 |
| marketplace_orders          | id, connection_id, external_order_id, order_date    |
| marketplace_order_items     | order_id, external_line_id, sku, qty                |
| marketplace_invoices        | order_id, external_invoice_number                   |
| marketplace_returns         | order_id, external_return_id, amount                |
| marketplace_settlements     | connection_id, settlement_id, settlement_date       |
| marketplace_fees            | settlement_id, fee_type, taxable_amount, tax_amount |
| marketplace_tcs_records     | connection_id, reference, amount, tax_type          |
| marketplace_reconciliations | id, import_id, status, difference_amount            |

Add unique constraints on source identifiers within the connection. For example:

```
UNIQUE (connection_id, external_order_id)
```

For external line items, use:

```
UNIQUE (marketplace_order_id, external_line_id)
```

This prevents accidental duplicate records during repeat imports.

### G. Shopify and custom connectors

| Table                   | Important columns                                     |
| ----------------------- | ----------------------------------------------------- |
| store_connections       | id, business_id, platform, store_domain               |
| integration_credentials | id, connection_id, encrypted_secret                   |
| connector_capabilities  | connector_id, capability, enabled                     |
| webhook_subscriptions   | connection_id, event_name, endpoint                   |
| webhook_events          | connection_id, external_event_id, event_name, payload |
| connector_jobs          | connection_id, job_type, status, started_at           |
| connector_sync_cursors  | connection_id, resource_type, cursor                  |
| external_order_mappings | connection_id, external_order_id, invoice_id          |
| api_keys                | organization_id, key_hash, name, last_used_at         |
| api_usage_logs          | api_key_id, endpoint, status_code, timestamp          |

Keep API credentials encrypted with an application key-management strategy. Never expose encrypted secrets to the frontend.

### H. GST returns and compliance

| Table                    | Important columns                            |
| ------------------------ | -------------------------------------------- |
| gst_return_periods       | gstin_id, return_type, period                |
| gst_return_runs          | period_id, status, generated_at              |
| gst_return_sections      | return_run_id, section_code, totals          |
| gst_return_records       | return_run_id, source_document_id, data      |
| gst_filing_logs          | gstin_id, return_type, arn, filed_at         |
| gst_reconciliations      | gstin_id, period, status                     |
| gst_reconciliation_items | reconciliation_id, purchase_id, match_status |
| gstr2b_imports           | gstin_id, period, source_file_id             |
| e_invoice_records        | invoice_id, irn, ack_number, status          |
| e_way_bills              | invoice_id, ewb_number, valid_until          |

# 5. Important PostgreSQL implementation examples

Here are some practical migration examples.

## 5.1 Organizations

```

Schema::create('organizations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('status')->default('active');
    $table->string('timezone')->default('Asia/Kolkata');
    $table->timestampsTz();
    $table->softDeletesTz();
});

```

## 5.2 Business GST registrations

```

Schema::create('business_gstins', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->uuid('business_id')->index();

    $table->char('gstin', 15);
    $table->char('state_code', 2);

    $table->string('legal_name');
    $table->string('trade_name')->nullable();

    $table->string('registration_type');
    $table->string('status')->default('pending');

    $table->date('effective_from')->nullable();
    $table->timestampsTz();

    $table->unique(['business_id', 'gstin']);
});

```

In production, also add appropriate foreign keys, organization ownership validation and normalized GSTIN validation.

## 5.3 Invoice table

```

Schema::create('invoices', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->uuid('organization_id')->index();
    $table->uuid('business_id')->index();
    $table->uuid('gstin_id')->index();
    $table->uuid('customer_id')->nullable();

    $table->string('invoice_number', 16);
    $table->date('invoice_date');
    $table->date('supply_date')->nullable();

    $table->string('document_type');
    $table->string('supply_type');

    $table->string('place_of_supply', 2)->nullable();

    $table->decimal('taxable_value', 20, 2);
    $table->decimal('cgst_amount', 20, 2)->default(0);
    $table->decimal('sgst_amount', 20, 2)->default(0);
    $table->decimal('igst_amount', 20, 2)->default(0);
    $table->decimal('cess_amount', 20, 2)->default(0);

    $table->decimal('discount_amount', 20, 2)->default(0);
    $table->decimal('round_off', 20, 2)->default(0);
    $table->decimal('grand_total', 20, 2);

    $table->string('currency', 3)->default('INR');
    $table->string('status')->default('draft');

    $table->jsonb('tax_snapshot');
    $table->jsonb('seller_snapshot');
    $table->jsonb('buyer_snapshot');

    $table->timestampTz('finalized_at')->nullable();
    $table->timestampsTz();

    $table->unique([
        'gstin_id',
        'invoice_number'
    ]);
});

```

The JSON snapshots preserve the seller, recipient and tax information as it appeared when the document was finalized.

Do not use JSONB as a replacement for normalized invoice item and tax tables.

## 5.4 Invoice item table

```

Schema::create('invoice_items', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->uuid('invoice_id')->index();
    $table->uuid('product_id')->nullable();

    $table->string('description');
    $table->string('hsn_sac', 8);

    $table->decimal('quantity', 20, 4);
    $table->string('unit_code')->nullable();

    $table->decimal('unit_price', 20, 4);
    $table->decimal('discount_amount', 20, 2)->default(0);
    $table->decimal('taxable_value', 20, 2);

    $table->decimal('cgst_amount', 20, 2)->default(0);
    $table->decimal('sgst_amount', 20, 2)->default(0);
    $table->decimal('igst_amount', 20, 2)->default(0);
    $table->decimal('cess_amount', 20, 2)->default(0);

    $table->decimal('total_amount', 20, 2);

    $table->timestampsTz();
});

```

Also create individual `invoice_taxes` rows. The duplicated tax totals in the invoice and item tables should be treated as validated snapshots, not independently editable values.

## 5.5 Invoice numbering transaction

Invoice numbers must be allocated using database locking.

```

DB::transaction(function () use ($sequenceId, $invoiceData) {

    $sequence = InvoiceSequence::query()
        ->whereKey($sequenceId)
        ->lockForUpdate()
        ->firstOrFail();

    $number = $sequence->prefix .
        str_pad(
            (string) $sequence->next_number,
            5,
            '0',
            STR_PAD_LEFT
        );

    $invoice = Invoice::create([
        ...$invoiceData,
        'invoice_number' => $number,
    ]);

    $sequence->increment('next_number');

    return $invoice;
});

```

This is a simplified example. The final implementation should reserve and validate the series, financial year, GSTIN and maximum 16-character number before finalizing.

# 6. GST calculation engine design

Build this as an independent domain service.

```
GSTEngine/
│
├── Services/
│   ├── GstCalculator.php
│   ├── PlaceOfSupplyResolver.php
│   ├── TaxRateResolver.php
│   ├── HsnValidator.php
│   ├── DiscountCalculator.php
│   └── RoundingService.php
│
├── Rules/
│   ├── IntraStateRule.php
│   ├── InterStateRule.php
│   ├── ExportRule.php
│   ├── SezRule.php
│   └── ReverseChargeRule.php
│
├── DTOs/
│   ├── TaxCalculationRequest.php
│   └── TaxCalculationResult.php
│
└── Tests/
```

## 6.1 Tax calculation workflow

1. Identify supplier GST registration.
2. Resolve recipient and delivery information.
3. Determine place of supply under applicable rules.
4. Determine supply classification.
5. Resolve HSN/SAC and effective tax rate.
6. Apply discount and taxable-value rules.
7. Determine CGST/SGST/UTGST/IGST and cess treatment.
8. Apply applicable rounding rules.
9. Store the complete calculation snapshot.
10. Run invoice compliance validation.

### 6.2 Tax engine output structure

```
{
  "currency": "INR",
  "supply_classification": "intra_state",
  "place_of_supply": "19",
  "taxable_value": "10000.00",
  "tax_breakup": {
    "cgst": {
      "rate": "9.00",
      "amount": "900.00"
    },
    "sgst": {
      "rate": "9.00",
      "amount": "900.00"
    },
    "igst": {
      "rate": "0.00",
      "amount": "0.00"
    },
    "cess": {
      "amount": "0.00"
    }
  },
  "total_tax": "1800.00",
  "invoice_total": "11800.00",
  "rule_version": "GST-RULE-2026-01"
}
```

The version shown is illustrative. Production rule versions must come from your approved tax-rule repository.

### 6.3 Special cases you must design for

- Composition taxpayers.
- Unregistered suppliers and recipients.
- Exempt and nil-rated supplies.
- Zero-rated exports.
- SEZ supplies.
- Reverse charge.
- Deemed exports.
- Mixed and composite supplies.
- Discounts and post-supply adjustments.
- Interstate supplies involving special place-of-supply provisions.
- Imports.
- Distinct persons and branch transfers.

Do not assume every inter-state transaction uses IGST solely because two GSTIN state codes differ. The place-of-supply and supply-classification rules must decide the treatment.

The statutory invoice fields and document requirements should be validated against current CGST Rules, especially Rules 46, 47, 49 and 53 as applicable.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cbic-gst.gov.in\&sz=32)

CBIC+2



# 7. Invoice lifecycle and accounting workflow

A finalized invoice is a financial record, not an ordinary editable form.

Recommended invoice lifecycle:

\#chatgpt-mermaid-\_r_vj\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_vj\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_vj\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_vj\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_vj\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_vj\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_vj\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_vj\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_vj\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_vj\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_vj\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_vj\_ p{margin:0;}#chatgpt-mermaid-\_r_vj\_ defs [id$="-barbEnd"]{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ g.stateGroup text{fill:rgb(31, 78, 148);stroke:none;font-size:10px;}#chatgpt-mermaid-\_r_vj\_ g.stateGroup text{fill:rgb(237, 237, 237);stroke:none;font-size:10px;}#chatgpt-mermaid-\_r_vj\_ g.stateGroup .state-title{font-weight:bolder;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ g.stateGroup rect{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_vj\_ g.stateGroup line{stroke:rgb(175, 175, 175);stroke-width:1;}#chatgpt-mermaid-\_r_vj\_ .transition{stroke:rgb(175, 175, 175);stroke-width:1;fill:none;}#chatgpt-mermaid-\_r_vj\_ .stateGroup .composit{fill:transparent;border-bottom:1px;}#chatgpt-mermaid-\_r_vj\_ .stateGroup .alt-composit{fill:#e0e0e0;border-bottom:1px;}#chatgpt-mermaid-\_r_vj\_ .state-note{stroke:rgb(58, 132, 63);fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_vj\_ .state-note text{fill:rgb(237, 237, 237);stroke:none;font-size:10px;}#chatgpt-mermaid-\_r_vj\_ .stateLabel .box{stroke:none;stroke-width:0;fill:rgb(9, 23, 44);opacity:0.5;}#chatgpt-mermaid-\_r_vj\_ .edgeLabel .label rect{fill:rgb(9, 23, 44);opacity:0.5;}#chatgpt-mermaid-\_r_vj\_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-\_r_vj\_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_vj\_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_vj\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .label div .edgeLabel{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .stateLabel text{fill:rgb(237, 237, 237);font-size:10px;font-weight:bold;}#chatgpt-mermaid-\_r_vj\_ .node circle.state-start{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ .node .fork-join{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ .node circle.state-end{fill:rgb(31, 78, 148);stroke:transparent;stroke-width:1.5;}#chatgpt-mermaid-\_r_vj\_ .end-state-inner{fill:transparent;stroke-width:1.5;}#chatgpt-mermaid-\_r_vj\_ .node rect{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_vj\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_vj\_ [id$="-barbEnd"]{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_vj\_ .statediagram-cluster rect{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_vj\_ .cluster-label,#chatgpt-mermaid-\_r_vj\_ .nodeLabel{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .statediagram-cluster rect.outer{rx:5px;ry:5px;}#chatgpt-mermaid-\_r_vj\_ .statediagram-state .divider{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_vj\_ .statediagram-state .title-state{rx:5px;ry:5px;}#chatgpt-mermaid-\_r_vj\_ .statediagram-cluster.statediagram-cluster .inner{fill:transparent;}#chatgpt-mermaid-\_r_vj\_ .statediagram-cluster.statediagram-cluster-alt .inner{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_vj\_ .statediagram-cluster .inner{rx:0;ry:0;}#chatgpt-mermaid-\_r_vj\_ .statediagram-state rect.basic{rx:5px;ry:5px;}#chatgpt-mermaid-\_r_vj\_ .statediagram-state rect.divider{stroke-dasharray:10,10;fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_vj\_ .note-edge{stroke-dasharray:5;}#chatgpt-mermaid-\_r_vj\_ .statediagram-note rect{fill:rgb(48, 48, 48);stroke:rgb(58, 132, 63);stroke-width:1px;rx:0;ry:0;}#chatgpt-mermaid-\_r_vj\_ .statediagram-note rect{fill:rgb(48, 48, 48);stroke:rgb(58, 132, 63);stroke-width:1px;rx:0;ry:0;}#chatgpt-mermaid-\_r_vj\_ .statediagram-note text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .statediagram-note .nodeLabel{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ .statediagram .edgeLabel{color:red;}#chatgpt-mermaid-\_r_vj\_ [id$="-dependencyStart"],#chatgpt-mermaid-\_r_vj\_ [id$="-dependencyEnd"]{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);stroke-width:1;}#chatgpt-mermaid-\_r_vj\_ .statediagramTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].statediagram-cluster rect{fill:rgb(9, 23, 44);stroke:url(#chatgpt-mermaid-\_r_vj\_-gradient);stroke-width:1;}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].statediagram-cluster rect.outer{rx:5px;ry:5px;filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_vj\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_vj\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_vj\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_vj\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_vj\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_vj\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}DraftValidatingReadyFinalizedSharedPartiallyPaidPaidCreditNoteCreatedCancelledValidation FailedOnly when legally permitted

### On invoice finalization

Run the following operations in a single controlled transaction:

1. Validate business and GSTIN.
2. Validate customer details.
3. Resolve tax.
4. Allocate invoice number.
5. Save invoice and items.
6. Save tax details.
7. Save seller and buyer snapshots.
8. Generate accounting journal entry.
9. Update stock, if inventory tracking is enabled.
10. Record audit event.
11. Dispatch PDF generation job.
12. Dispatch customer notification job.

For example, a taxable cash sale will generally debit cash/bank or receivables and credit sales and output tax accounts. The exact entries should depend on the transaction and accounting configuration.

Do not make PDF generation or email delivery part of the database transaction. Queue them after the invoice has been committed.

# 8. Marketplace import engine

This is a core Quantum GST module and should be designed as a reusable framework.

## 8.1 Importer architecture

```
Marketplace/
│
├── Contracts/
│   ├── MarketplaceAdapter.php
│   └── ReportParser.php
│
├── Adapters/
│   ├── Amazon/
│   ├── Meesho/
│   ├── Flipkart/
│   ├── Meta/
│   └── GenericCSV/
│
├── Parsers/
│   ├── CsvParser.php
│   ├── ExcelParser.php
│   └── ZipParser.php
│
├── Normalizers/
│   ├── OrderNormalizer.php
│   ├── ReturnNormalizer.php
│   ├── SettlementNormalizer.php
│   └── TaxNormalizer.php
│
├── Services/
│   ├── ImportManager.php
│   ├── ColumnMapper.php
│   ├── DuplicateDetector.php
│   └── ReconciliationService.php
│
├── Jobs/
│   ├── DetectReportType.php
│   ├── ParseMarketplaceFile.php
│   ├── ValidateMarketplaceRows.php
│   └── ImportMarketplaceRecords.php
│
└── DTOs/
```

## 8.2 Standard adapter interface

```

interface MarketplaceAdapter
{
    public function getCode(): string;

    public function detect(array $headers): bool;

    public function supportedReports(): array;

    public function parse(
        string $filePath,
        string $reportType
    ): iterable;

    public function normalize(
        array $record,
        string $reportType
    ): array;

    public function validate(array $record): array;
}

```

Every marketplace adapter should convert its source data into your internal standard format.

## 8.3 Standard import workflow

\#chatgpt-mermaid-\_r_106\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_106\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_106\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_106\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_106\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_106\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_106\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_106\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_106\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_106\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_106\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_106\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_106\_ p{margin:0;}#chatgpt-mermaid-\_r_106\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_106\_ .label text,#chatgpt-mermaid-\_r_106\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .node rect,#chatgpt-mermaid-\_r_106\_ .node circle,#chatgpt-mermaid-\_r_106\_ .node ellipse,#chatgpt-mermaid-\_r_106\_ .node polygon,#chatgpt-mermaid-\_r_106\_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .rough-node .label text,#chatgpt-mermaid-\_r_106\_ .node .label text,#chatgpt-mermaid-\_r_106\_ .image-shape .label,#chatgpt-mermaid-\_r_106\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_106\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .rough-node .label,#chatgpt-mermaid-\_r_106\_ .node .label,#chatgpt-mermaid-\_r_106\_ .image-shape .label,#chatgpt-mermaid-\_r_106\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_106\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_106\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_106\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_106\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_106\_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-\_r_106\_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_106\_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_106\_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-\_r_106\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_106\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_106\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_106\_ .icon-shape,#chatgpt-mermaid-\_r_106\_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-\_r_106\_ .icon-shape p,#chatgpt-mermaid-\_r_106\_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-\_r_106\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_106\_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_106\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_106\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_106\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_106\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_106\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_106\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_106\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_106\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_106\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_106\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_106\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_106\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_106\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_106\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_106\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .node rect,#chatgpt-mermaid-\_r_106\_ .node circle,#chatgpt-mermaid-\_r_106\_ .node ellipse,#chatgpt-mermaid-\_r_106\_ .node polygon,#chatgpt-mermaid-\_r_106\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_106\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_106\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_106\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_106\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_106\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Upload FileStore Original FileCalculate ChecksumDetect MarketplaceDetect Report TypeMap ColumnsParse RowsNormalize DataValidate RecordsValid?Duplicate CheckError RecordsSave Normalized RecordsReconciliationGST ReportsYesNo

## 8.4 Import data model

Every import should have:

```
{
  "id": "uuid",
  "marketplace": "amazon",
  "report_type": "orders",
  "file_name": "amazon_orders_october.csv",
  "checksum": "sha256-hash",
  "status": "completed",
  "total_rows": 1500,
  "valid_rows": 1480,
  "invalid_rows": 10,
  "duplicate_rows": 10,
  "mapping_version": 1
}
```

Store raw source rows separately from normalized transactions. This is important when a marketplace changes its Excel format.

## 8.5 Column mapping engine

Create a frontend interface where customers can map unknown marketplace columns.

Marketplace column mapping

Source: Meesho CSV

Example mapping

Source column

Order ID

Quantum GST field

external_order_id

Source column

Sub Order ID

Quantum GST field

external_line_id

Source column

GST Amount

Quantum GST field

tax_amount

Source column

Selling Price

Quantum GST field

selling_price

Source column

Customer State

Quantum GST field

customer_state

Source column

Order Status

Quantum GST field

transaction_status

Save mappings as reusable templates for future imports.

### Import validation rules

- Unknown HSN.
- Missing invoice number.
- Duplicate order.
- Invalid GSTIN.
- Invalid state code.
- Invalid tax rate.
- Negative quantity.
- Tax calculation mismatch.
- Missing invoice date.
- Invalid transaction status.
- Marketplace fee without supporting transaction.
- Settlement difference.

Allow users to correct errors and reprocess only failed records.

## 8.6 Marketplace reconciliation model

Keep the following separate:

1. Sales orders.
2. Tax invoices.
3. Customer returns.
4. Credit notes.
5. Marketplace fees.
6. Marketplace settlement.
7. Income-tax TDS.
8. GST TCS.
9. Refund transactions.

Do not create an invoice merely because a settlement report contains a payment. The sales invoice must originate from the underlying supply and applicable invoicing requirements.

For example:

```
Marketplace gross sales          ₹100,000
Customer refunds                  ₹5,000
Marketplace commission            ₹8,000
Shipping/other fees               ₹2,000
GST on marketplace fees           ₹1,800
Other deductions                    ₹500
------------------------------------------
Expected settlement               ₹82,700
```

This is a simplified reconciliation example. The actual treatment depends on the marketplace's fee structure, GST documents, settlement adjustments and tax reporting.

# 9. Shopify integration – detailed technical design

Build Shopify as a first-class connector, not as a simple webhook endpoint.

First release priority

Important implementation choice: Use Shopify's GraphQL Admin API for the new app. Shopify states that new public apps must use GraphQL Admin API rather than REST Admin API.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://shopify.dev\&sz=32)

Shopify+1



Official developer documentation: [Shopify Webhooks](https://shopify.dev/docs/api/webhooks/latest?utm_source=chatgpt.com).

## 9.1 Shopify app installation

Flow:

```
Merchant opens Shopify App Store
          |
Installs Quantum GST
          |
OAuth authorization
          |
Verify state and HMAC
          |
Exchange authorization code
          |
Save encrypted access token
          |
Fetch store details
          |
Merchant selects GSTIN
          |
Configure invoice rules
          |
Register webhooks
          |
Initial historical sync
```

Use Shopify's current app distribution and authorization requirements, including required compliance webhooks for customer data requests, customer redaction and shop redaction.

## 9.2 Shopify database tables

`store_connections`

```
id
organization_id
business_id
platform
store_domain
external_store_id
access_token_encrypted
scopes
status
connected_at
last_sync_at
created_at
updated_at
```

`shopify_order_mappings`

```
id
connection_id
shopify_order_id
shopify_order_name
shopify_order_number
invoice_id
external_updated_at
sync_status
created_at
updated_at
```

`shopify_webhook_events`

```
id
connection_id
shopify_event_id
topic
payload
payload_hash
processing_status
received_at
processed_at
error_message
```

## 9.3 Webhook topics

Subscribe only to the topics required by the app.

| Event                  | Processing                        |
| ---------------------- | --------------------------------- |
| orders/create          | Receive new order                 |
| orders/updated         | Refresh order data                |
| orders/cancelled       | Handle cancellation               |
| refunds/create         | Refund and credit-note workflow   |
| fulfillments/create    | Dispatch update                   |
| app/uninstalled        | Revoke credentials and disconnect |
| customers/data_request | Privacy compliance                |
| customers/redact       | Customer data privacy workflow    |
| shop/redact            | Store data privacy workflow       |

Confirm current event availability, access scopes and payload schemas during implementation. Shopify's webhook documentation is versioned and should be treated as the source of truth.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://shopify.dev\&sz=32)

Shopify+1



## 9.4 Webhook processing

```

Route::post(
    '/webhooks/shopify/orders-created',
    [ShopifyWebhookController::class, 'receive']
);

```

Controller responsibilities:

```
1. Read raw request body.
2. Verify X-Shopify-Hmac-SHA256.
3. Verify shop domain.
4. Extract event ID and topic.
5. Store event in database.
6. Check duplicate event.
7. Dispatch background job.
8. Return HTTP 200 quickly.
```

HMAC verification must use the raw request body and constant-time comparison. Never trust a JSON body before signature verification.

## 9.5 Invoice automation rules

Allow merchants to configure:

| Setting          | Options                                   |
| ---------------- | ----------------------------------------- |
| Invoice trigger  | Order confirmation / payment / fulfilment |
| GST registration | Select business GSTIN                     |
| Customer type    | B2B / B2C / automatic                     |
| Number series    | Per GSTIN / custom series                 |
| HSN              | Product mapping / default                 |
| PDF              | Generate automatically                    |
| Delivery         | Email / Shopify order attachment          |
| Refunds          | Credit-note workflow                      |
| Historical sync  | Selected date range                       |
| Failed invoices  | Retry / manual review                     |

Use an idempotency key:

```
shopify:{connection_id}:{order_id}:{document_type}
```

This prevents duplicate invoices when Shopify retries a webhook.

## 9.6 Shopify customer experience

The customer should receive:

- Invoice number.
- Invoice date.
- Supplier GSTIN.
- Customer information.
- HSN/SAC.
- Taxable amount.
- CGST/SGST/IGST.
- Total invoice value.
- IRN and signed QR when applicable.

Provide a downloadable PDF link and a secure invoice retrieval endpoint.

# 10. Quantum GST public API specification

The API should be independent of Shopify.

Shopify, WooCommerce, custom Laravel websites, and external developers should all use the same invoice creation service.

## 10.1 API base URL

```
https://api.quantumgst.in/v1
```

Recommended environments:

```
Production:
https://api.quantumgst.in/v1

Sandbox:
https://sandbox-api.quantumgst.in/v1
```

## 10.2 Authentication

Use API keys initially for server-to-server integration.

Example:

```
Authorization: Bearer qgst_live_xxxxxxxxx
Content-Type: application/json
Idempotency-Key: order-10001-invoice
```

Store only the hashed API key. Display the secret once when generated.

Separate production and sandbox keys.

## 10.3 API endpoints

### Authentication and organization

| Method | Endpoint      | Purpose                 |
| ------ | ------------- | ----------------------- |
| GET    | `/me`         | API account information |
| GET    | `/businesses` | List businesses         |
| GET    | `/gstins`     | List GST registrations  |
| GET    | `/products`   | List products           |
| POST   | `/products`   | Create product          |
| GET    | `/customers`  | List customers          |
| POST   | `/customers`  | Create customer         |

### Billing

| Method | Endpoint                  | Purpose                       |
| ------ | ------------------------- | ----------------------------- |
| POST   | `/invoices`               | Create invoice                |
| GET    | `/invoices`               | List invoices                 |
| GET    | `/invoices/{id}`          | Invoice details               |
| POST   | `/invoices/{id}/finalize` | Finalize invoice              |
| GET    | `/invoices/{id}/pdf`      | Download PDF                  |
| POST   | `/invoices/{id}/cancel`   | Request cancellation workflow |
| POST   | `/credit-notes`           | Create credit note            |
| POST   | `/debit-notes`            | Create debit note             |

### Marketplace

| Method | Endpoint                          | Purpose               |
| ------ | --------------------------------- | --------------------- |
| POST   | `/marketplace/imports`            | Start import          |
| GET    | `/marketplace/imports/{id}`       | Import status         |
| POST   | `/marketplace/imports/{id}/retry` | Retry failures        |
| GET    | `/marketplace/reconciliation`     | Reconciliation report |
| GET    | `/marketplace/settlements`        | Settlement records    |

### GST reports

| Method | Endpoint              | Purpose              |
| ------ | --------------------- | -------------------- |
| GET    | `/gst/summary`        | GST summary          |
| GET    | `/gst/reports/gstr1`  | GSTR-1 working data  |
| GET    | `/gst/reports/gstr3b` | GSTR-3B working data |
| GET    | `/gst/reports/hsn`    | HSN summary          |
| GET    | `/gst/reports/itc`    | ITC report           |
| GET    | `/gst/reports/sales`  | Sales report         |

### Developer integrations

| Method | Endpoint            | Purpose           |
| ------ | ------------------- | ----------------- |
| POST   | `/webhooks`         | Register callback |
| GET    | `/webhooks`         | List callbacks    |
| DELETE | `/webhooks/{id}`    | Remove callback   |
| GET    | `/api-usage`        | Usage report      |
| POST   | `/connections/test` | Test connection   |

## 10.4 Create invoice request

```

{
  "external_reference": "SHOP-10001",
  "business_id": "BUSINESS_UUID",
  "gstin_id": "GSTIN_UUID",
  "document_type": "tax_invoice",
  "invoice_date": "2026-10-30",
  "customer": {
    "name": "Customer Name",
    "gstin": null,
    "state_code": "19",
    "address": "Kolkata, West Bengal"
  },
  "items": [
    {
      "sku": "KURTI-001",
      "description": "Cotton Kurti",
      "hsn_sac": "VERIFY_HSN",
      "quantity": "2",
      "unit_code": "PCS",
      "unit_price": "500.00",
      "discount": "0.00",
      "tax_category_id": "TAX_CATEGORY_UUID"
    }
  ],
  "notes": "Shopify Order #10001"
}

```

Notice that the API does not blindly trust a submitted GST rate. It resolves the tax rate from your approved product tax profile and applicable rule version. If a caller supplies an HSN or tax category, validate it.

## 10.5 API response

```

{
  "success": true,
  "data": {
    "id": "INVOICE_UUID",
    "invoice_number": "QGST/2026-27/00001",
    "status": "draft",
    "taxable_value": "1000.00",
    "total_tax": "50.00",
    "grand_total": "1050.00",
    "currency": "INR",
    "pdf_url": null
  }
}

```

The API should distinguish draft creation from finalization. Finalization should be an explicit operation unless the merchant has enabled a controlled auto-finalization policy.

## 10.6 Standard API error response

```

{
  "success": false,
  "error": {
    "code": "GST_VALIDATION_FAILED",
    "message": "Invoice validation failed.",
    "details": [
      {
        "field": "items.0.hsn_sac",
        "code": "INVALID_HSN",
        "message": "Please verify the HSN/SAC classification."
      }
    ],
    "request_id": "req_uuid"
  }
}

```

## 10.7 Webhook events

Provide these outgoing events:

```
invoice.created
invoice.finalized
invoice.pdf.generated
invoice.cancelled
credit_note.created
marketplace.import.completed
marketplace.import.failed
reconciliation.completed
connector.sync.failed
gst.return.generated
gst.filing.status_updated
```

Outgoing webhooks should have:

- HMAC signatures.
- Delivery attempts.
- Retry with exponential backoff.
- Dead-letter queue.
- Event IDs.
- Replay functionality.
- Delivery logs.

# 11. GST reports and GSP integration architecture

Keep GST report preparation independent of external filing providers.

```
GSTReports/
    |
    |-- GSTR1Builder
    |-- GSTR3BBuilder
    |-- GSTR2BImporter
    |-- HSNReportBuilder
    |-- ITCReconciliation
    |
    v
GSTIntegration/
    |
    |-- GSPProviderInterface
    |-- GSPProviderA
    |-- GSPProviderB
    |-- GSTSandboxAdapter
    |
    v
External GSTN infrastructure
```

### GSP adapter interface

```

interface GspProviderInterface
{
    public function authenticate(array $credentials): array;

    public function verifyGstin(string $gstin): array;

    public function fetchGstr2b(array $request): array;

    public function prepareGstr1(array $payload): array;

    public function submitGstr1(array $payload): array;

    public function getReturnStatus(array $request): array;
}

```

Implement provider capabilities according to the actual contracted GSP API. Do not assume every provider exposes identical endpoints.

### Filing workflow

1. Generate the return working data.
2. Run schema validation.
3. Run business validation.
4. Accountant reviews.
5. Obtain taxpayer authorization.
6. Send through approved GSP integration.
7. Store submission reference and response.
8. Track filing status.
9. Save ARN and filing acknowledgement.
10. Lock the relevant filed return snapshot.

Build a provider-independent GSP layer so you can change providers without rewriting the GST reporting system.

For e-invoice and e-way bill integrations, maintain separate provider adapters and separate authorization/configuration.

The official e-invoice developer portal publishes schemas, request samples and API validations. The e-way bill API onboarding process also specifies sandbox testing and production onboarding requirements.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.gstn.org.in\&sz=32)

Goods and Services Tax Network+2



Release decision: GSP filing should be a second-stage integration. Your first milestone should complete invoice generation and return preparation without depending on external approvals.

# 12. React frontend architecture

Use React + TypeScript + Vite for the frontend.

Recommended libraries:

| Requirement   | Library                  |
| ------------- | ------------------------ |
| Routing       | React Router             |
| API           | Axios + TanStack Query   |
| Forms         | React Hook Form          |
| Validation    | Zod                      |
| UI            | Tailwind CSS + shadcn/ui |
| Tables        | TanStack Table           |
| Charts        | Recharts                 |
| State         | Zustand                  |
| Date handling | date-fns                 |
| Notifications | Sonner                   |
| Icons         | Lucide React             |

## 12.1 Frontend project structure

```
frontend/
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers/
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── AdminLayout.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── charts/
│   │   ├── invoice/
│   │   └── common/
│   │
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── businesses/
│   │   ├── gstins/
│   │   ├── invoices/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── products/
│   │   ├── purchases/
│   │   ├── marketplace/
│   │   ├── reconciliation/
│   │   ├── reports/
│   │   ├── accounting/
│   │   ├── integrations/
│   │   ├── developer/
│   │   └── settings/
│   │
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── main.tsx
│
├── public/
├── package.json
└── vite.config.ts
```

## 12.2 Application routes

```
/login
/register
/onboarding

/app/dashboard

/app/businesses
/app/gst-registrations

/app/sales/invoices
/app/sales/invoices/create
/app/sales/credit-notes
/app/sales/debit-notes
/app/sales/quotations

/app/purchases
/app/purchases/bills

/app/products
/app/customers
/app/suppliers
/app/inventory

/app/accounting/ledger
/app/accounting/journals
/app/accounting/expenses
/app/accounting/bank

/app/marketplaces
/app/marketplaces/imports
/app/marketplaces/reconciliation
/app/marketplaces/settlements

/app/integrations
/app/integrations/shopify
/app/integrations/custom-connectors

/app/gst/reports
/app/gst/gstr1
/app/gst/gstr3b
/app/gst/gstr2b
/app/gst/itc-reconciliation

/app/developer/api-keys
/app/developer/webhooks
/app/developer/documentation

/app/settings
/app/subscription
```

## 12.3 Important UI screens to develop first

[Finexy Dashboard ui by Hasnain UI on Dribbble](https://images.openai.com/static-rsc-4/s4aaxUxmDU6X0HaWgreOLcorhnBIqNH07syIFTRjW1JP0Uic9wg-FGXnf_5ecA7uM0cwrT4KubOMQvgFZHKFyFMXkcXkOfGZjuvsIlm7N3kn0cdXyLch2jjBhuJLtzmqf7smYkAVvEubaztdGDHYI7-9E9ThD67RaRiE7HuxqFE?purpose=inline)

1\. Business dashboard

Sales, purchase, outstanding, GST summary, ITC, marketplace imports and recent invoices.

[How to Use Party-Wise Item Prices - myBillBook](https://images.openai.com/static-rsc-4/UYR6-uKrp7tVExHLiCg2WjFwInX4_xd-iDl4e5noZZQzbDY3IUn6u-U-q4G038OZrYv9GVbMEtuZtUUqMqw9IgfqPMpY_WiBQt0Z0zXu4oJ0exAFO1mdc_xGNxhVj1dj3uA0PQl6ygRKeQWPr3DWsE3Sd6eBUHdA3LdKJ2nG8Do?purpose=inline)

2\. Invoice creation

GSTIN selection, customer search, product search, tax calculation, payment and PDF preview.

[nuvo Software Reviews, Demo & Pricing - 2026](https://images.openai.com/static-rsc-4/eG1bwZ6rLA3ruuiBDx9SDoA0cbNmQvaju0NJDF1ee0liTBxikADM56ehtwz53uMOhC103h-fEssMyM5X7NtUvfTJQ-WKhU65TBJFldncfrNE6DdDRfDciEVg_KGGsCn88Chbydmj91qMjBkpDMOAHpKCuiYma3g8nrgo5vmF_W4?purpose=inline)

3\. Marketplace imports

File upload, marketplace detection, column mapping, validation and import results.

[How to Convert Bank Statement PDF to Excel: Complete Guide (2026) | ParseFlow AI](https://images.openai.com/static-rsc-4/MBsx0i64FmXrdsT2FF-5cmtREpRvMq17u_lc0nTsru9p5D2bmFpntUtBc8xks-7ixu6koX_v2RB8YJFq9qX1RcTTzeUJ3Tbvd6NZ71WWdXH3bdwFUJlbPGfYcWTtDFvSaLYquGx9pYbZcrSyxO0WaG2r5pQs09iGe0tEjVjYzUE?purpose=inline)

4\. Reconciliation

Sales, returns, fees, TCS, settlements, mismatches and adjustments.

[Crear una aplicación web para gestionar claves API, cuotas y analítica de uso | Koder.ai](https://images.openai.com/static-rsc-4/NqYPAPPiyfuKNC0A8xLDios0ldVLsNtIDA413AYtH18XR2LWr0IwoqNqXDKEn-pbJe42dJiW4GRHGzxyZCWYPv8wkbF_LbiJq6QpxcbdOxGgRrYUvGIq0U57HA1R7JlqXKbapfBK6eA_7LznBJwXdR2c5eA9lgJripcyzJbgAys?purpose=inline)

5\. Developer portal

API keys, integration instructions, webhook events, logs and usage.

# 13. Queue and background processing architecture

This is essential because marketplace imports and invoice generation can involve thousands of records.

Create dedicated queues rather than processing everything in the default queue.

| Queue            | Jobs                                     |
| ---------------- | ---------------------------------------- |
| `critical`       | Financial document processing            |
| `webhooks`       | Incoming and outgoing webhook processing |
| `invoices`       | PDF and invoice notifications            |
| `marketplace`    | File imports and normalization           |
| `reconciliation` | Settlement and GST reconciliation        |
| `integrations`   | Shopify and other connector sync         |
| `gst`            | Return generation and validation         |
| `reports`        | Excel and PDF reports                    |
| `notifications`  | Email and SMS                            |

Example:

```
ProcessMarketplaceImport::dispatch($importId)
    ->onQueue('marketplace');

GenerateInvoicePdf::dispatch($invoiceId)
    ->onQueue('invoices');

ProcessShopifyWebhook::dispatch($eventId)
    ->onQueue('webhooks');
```

### Queue reliability

Implement:

- Job retry policies.
- Exponential backoff.
- Failed job storage.
- Idempotent jobs.
- Job timeout limits.
- Import batch processing.
- Queue monitoring.
- Dead-letter processing.
- Job cancellation where safe.

Laravel's queue system supports Redis and other backends, and its worker lifecycle needs managed restarts during deployments.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://laravel.com\&sz=32)

Laravel



### Large file processing

For large marketplace files:

1. Upload directly to object storage.
2. Create an import record.
3. Read the file in chunks.
4. Insert raw records in batches.
5. Normalize in separate jobs.
6. Validate in separate jobs.
7. Generate import summary.

Avoid loading a 500 MB Excel file entirely into PHP memory.

Prefer streaming CSV parsing and chunked XLSX processing.

# 14. Multi-tenant security design

Quantum GST will hold information from multiple independent businesses. Tenant isolation is non-negotiable.

## 14.1 Tenant resolution

Every authenticated request should resolve:

```
Authenticated user
      |
Selected organization
      |
Organization membership validation
      |
Selected business
      |
GSTIN authorization
      |
Business operation
```

Never trust `organization_id` supplied by the frontend without verifying membership.

## 14.2 Database isolation

Recommended strategy:

- Shared database.
- Shared schema.
- UUID identifiers.
- `organization_id` on all tenant-owned records.
- `business_id` on business-specific records.
- `gstin_id` on registration-specific documents.
- PostgreSQL RLS for defense in depth.

Use separate database connections or carefully managed transaction-local tenant context for RLS. Ensure pooled connections cannot leak tenant context between requests.

## 14.3 Financial audit log

Create an `audit_logs` table:

```
id
organization_id
business_id
user_id
action
entity_type
entity_id
before_data
after_data
ip_address
user_agent
created_at
```

Record:

- Invoice finalized.
- Invoice cancellation.
- Credit note created.
- GST rate configuration changed.
- GSTIN changed.
- Marketplace connection added.
- API key generated or revoked.
- Return generated or filed.
- Financial period closed.

Never record API passwords, Shopify tokens or full payment credentials in audit payloads.

## 14.4 Backup and disaster recovery

Initial production policy:

| Item                   | Recommended policy        |
| ---------------------- | ------------------------- |
| Database backup        | Daily full backup         |
| Point-in-time recovery | Enable                    |
| File backup            | Object-storage versioning |
| Backup encryption      | Required                  |
| Recovery testing       | Monthly                   |
| Database monitoring    | Continuous                |
| Application monitoring | Continuous                |
| Security audit         | Periodic                  |

For financial SaaS, decide explicit RPO and RTO targets. A reasonable initial objective is RPO 15 minutes and RTO 4 hours, subject to infrastructure and budget.

# 15. Testing and quality assurance

Build tests alongside the modules, not after development.

## 15.1 Testing structure

```
tests/
│
├── Unit/
│   ├── GST/
│   │   ├── GstCalculatorTest.php
│   │   ├── PlaceOfSupplyTest.php
│   │   └── TaxRateResolverTest.php
│   │
│   ├── Billing/
│   │   ├── InvoiceNumberTest.php
│   │   └── InvoiceFinalizationTest.php
│   │
│   └── Marketplace/
│       ├── AmazonParserTest.php
│       ├── MeeshoParserTest.php
│       └── FlipkartParserTest.php
│
├── Feature/
│   ├── AuthenticationTest.php
│   ├── TenantIsolationTest.php
│   ├── InvoiceApiTest.php
│   ├── MarketplaceImportTest.php
│   └── ShopifyWebhookTest.php
│
├── Integration/
│   ├── ShopifyGraphQLTest.php
│   ├── GspProviderTest.php
│   └── StorageTest.php
│
└── Compliance/
    ├── InvoiceRule46Test.php
    ├── TaxCalculationTest.php
    ├── Gstr1ValidationTest.php
    └── Gstr3bValidationTest.php
```

## 15.2 Mandatory test cases

GST engine

- Intra-state and inter-state supplies.
- Different tax rates.
- Inclusive and exclusive tax.
- Discount calculations.
- Rounding.
- Reverse charge.
- Export and SEZ.
- Credit and debit notes.
- Historical tax-rate changes.

Billing

- Concurrent invoice generation.
- Duplicate invoice prevention.
- Financial-year changes.
- Invoice numbering.
- Finalized invoice immutability.
- Cancellation and credit-note workflows.

Marketplace

- Different Excel versions.
- CSV encoding.
- Duplicate imports.
- Missing fields.
- Incorrect tax values.
- Refunds.
- Partial settlements.
- Negative adjustments.
- Duplicate settlement records.

Shopify

- HMAC verification.
- Duplicate webhook.
- Webhook timeout.
- Order cancellation.
- Refund.
- Partial refund.
- Uninstall.
- Historical sync.
- API throttling.

Multi-tenancy

- User cannot access another organization.
- API key cannot access another business.
- Background jobs retain tenant context.
- File downloads validate ownership.
- Reports cannot leak data across GSTINs.

# 16. Deployment and infrastructure

I recommend starting with a production VPS and separating the database, Redis, workers and web server logically.

## 16.1 Infrastructure architecture

```
                 Cloudflare
                     |
                 Nginx / SSL
                     |
             Laravel Application
                     |
        +------------+------------+
        |            |            |
    PostgreSQL     Redis      Object Storage
        |            |
    Backups      Horizon Workers
                     |
         +-----------+-----------+
         |           |           |
      Imports     Shopify      Reports
```

### Recommended domains

| Domain                      | Purpose                 |
| --------------------------- | ----------------------- |
| `quantumgst.in`             | Main website            |
| `app.quantumgst.in`         | Customer application    |
| `api.quantumgst.in`         | Production API          |
| `sandbox-api.quantumgst.in` | Sandbox API             |
| `docs.quantumgst.in`        | Developer documentation |
| `status.quantumgst.in`      | System status           |
| `admin.quantumgst.in`       | Super admin             |

Check domain availability before purchasing.

### Docker services

```
services:
  nginx:
  laravel-app:
  queue-critical:
  queue-marketplace:
  queue-integrations:
  queue-reports:
  scheduler:
  postgres:
  redis:
```

For production, use managed PostgreSQL or a properly secured separate database server. Do not expose PostgreSQL or Redis publicly.

### Environments

Maintain three separate environments:

1. Local development.
2. Staging and integration testing.
3. Production.

Shopify sandbox/testing stores, marketplace sample reports and GSP sandbox credentials must not share production credentials.

# 17. Development milestones and delivery plan

I would divide the first release into eight development sprints.

## Quantum GST – First release roadmap

1. Sprint 1 – Foundation

   Week 1–2
   - Laravel project.
   - React setup.
   - PostgreSQL.
   - Redis and queues.
   - Authentication.
   - Organization and business setup.
   - Tenant isolation.
   - Roles and permissions.
2. Sprint 2 – Master data and GST engine

   Week 3–4
   - GSTIN management.
   - Customer and supplier.
   - Products and HSN.
   - Tax-rate master.
   - Place-of-supply engine.
   - Tax calculation.
   - Financial-year management.
3. Sprint 3 – Billing

   Week 5–6
   - Invoice numbering.
   - GST invoices.
   - Bill of supply.
   - Credit notes.
   - Debit notes.
   - PDF templates.
   - Invoice history.
   - Payment records.
4. Sprint 4 – Marketplace framework

   Week 7–8
   - Upload manager.
   - CSV/XLSX parser.
   - Column mapping.
   - Import validation.
   - Normalized order model.
   - Duplicate detection.
   - Import history.
5. Sprint 5 – Marketplace adapters

   Week 9–10
   - Amazon report adapters.
   - Meesho report adapters.
   - Flipkart report adapters.
   - Return and settlement import.
   - TCS reconciliation.
   - Marketplace dashboards.
6. Sprint 6 – Public API and Shopify

   Week 11–13
   - API authentication.
   - Invoice API.
   - Webhook framework.
   - Shopify OAuth.
   - Shopify GraphQL.
   - Order sync.
   - Invoice automation.
   - Refund workflow.
7. Sprint 7 – GST reports

   Week 14–15
   - Sales register.
   - Purchase register.
   - HSN summary.
   - GSTR-1 preparation.
   - GSTR-3B preparation.
   - GSTR-2B import and matching.
8. Sprint 8 – Testing and release

   Week 16–18
   - Compliance validation.
   - Security testing.
   - API documentation.
   - Load testing.
   - Backups.
   - Production deployment.
   - Initial customer onboarding.

# 18 weeks

Indicative MVP development schedule with a small experienced team. Provider onboarding, marketplace permissions and third-party certification may extend the timeline.

Scope boundary: The first release includes GST report preparation and import/reconciliation. Full accounting, advanced inventory, direct GSP filing, e-invoice and e-way bill automation should be subsequent milestones unless the team has sufficient capacity to build them in parallel.

# 18. Development team and responsibilities

For a reliable first release, I recommend:

| Role                  | Responsibility                      |
| --------------------- | ----------------------------------- |
| Backend developer     | Laravel modules and APIs            |
| Frontend developer    | React dashboard                     |
| Integration developer | Shopify and marketplace adapters    |
| GST domain consultant | Tax rules and compliance validation |
| QA engineer           | Automated and manual tests          |
| DevOps engineer       | Deployment and infrastructure       |

A small team can combine roles, but GST domain validation should not be skipped.

# 19. Important implementation decisions

These are the technical rules I would establish before development starts.

| Decision                 | Recommended approach                |
| ------------------------ | ----------------------------------- |
| Application architecture | Modular monolith                    |
| Database                 | Shared PostgreSQL                   |
| Tenant isolation         | Organization-scoped + RLS           |
| Public identifiers       | UUID                                |
| Money calculations       | Decimal arithmetic                  |
| Invoice changes          | Immutable finalized records         |
| Tax rules                | Versioned and effective-dated       |
| Marketplace import       | Raw + normalized data               |
| Duplicate prevention     | Idempotency + unique constraints    |
| Shopify                  | GraphQL Admin API                   |
| Webhooks                 | Queued processing                   |
| API                      | REST with versioning                |
| GSP                      | Provider adapter pattern            |
| File processing          | Chunked imports                     |
| Reporting                | Separate reporting builders         |
| Audit                    | Append-only financial event history |

## 19.1 One particularly important design decision: do not mix marketplace orders with statutory invoices

Create three separate concepts:

- `marketplace_orders`: What the marketplace reports as an order.
- `sales_documents`: What the seller actually issues as a tax document.
- `marketplace_settlements`: What the marketplace pays or deducts.

Connect them through mapping tables.

This avoids duplicate sales, incorrect GST reporting and confusion between settlement value and taxable value.

## 19.2 Another important decision: keep tax rules separate from product GST rates

A product's tax profile should not simply be a fixed `gst_rate` column.

Instead, store:

- HSN/SAC.
- Classification.
- Tax category.
- Effective date.
- Applicable rate.
- Supply type.
- Exemption status.
- Cess treatment.
- Relevant conditions.

A product may have different tax treatment depending on its classification and transaction circumstances. Require approved tax configurations rather than guessing a rate from the product name.

# 20. What should be built first – actual development order

My recommendation is to start implementation in this exact order:

## Initial development backlog

First 15 implementation tasks

Implementation progress

## 0/15

Laravel + React project initialization

PostgreSQL database and UUID conventions

Organization and multi-tenant authentication

Business and multiple GSTIN onboarding

Roles and permission management

Customer and supplier management

Product, HSN and tax category management

Versioned GST calculation engine

Invoice numbering and financial-year logic

GST invoice generation and PDF

Credit notes and debit notes

Marketplace upload and import engine

Amazon, Meesho and Flipkart adapters

Public invoice API and webhook system

Shopify application and automatic invoicing

&#x20;Copy development checklist

## 21. Compliance documentation to keep alongside the code

Maintain a dedicated `docs/gst-compliance` directory containing:

```
docs/gst-compliance/
│
├── gst-law-reference.md
├── invoice-rules.md
├── place-of-supply.md
├── gst-tax-calculation.md
├── hsn-sac-classification.md
├── gstr1-mapping.md
├── gstr3b-mapping.md
├── gstr2b-reconciliation.md
├── marketplace-tax-treatment.md
├── ecommerce-operator-rules.md
├── e-invoice-api.md
├── ewaybill-api.md
└── gst-change-log.md
```

Use the official sources as the authority for compliance changes:

- [CBIC Tax Information Portal](https://taxinformation.cbic.gov.in/?utm_source=chatgpt.com) – Acts, Rules, notifications and circulars.
- [CGST Invoice Rules](https://cbic-gst.gov.in/gst-invoice-rules.html?utm_source=chatgpt.com) – Invoice particulars.
- [GSTN E-Invoice Resources](https://www.gstn.org.in/e-invoicing?utm_source=chatgpt.com) – E-invoice documentation.
- [E-Way Bill API Onboarding](https://docs.ewaybillgst.gov.in/apidocs/on-boarding-process.html?utm_source=chatgpt.com) – API onboarding.
- [Shopify Webhooks Documentation](https://shopify.dev/docs/api/webhooks/latest?utm_source=chatgpt.com) – Store integration.

Assign every compliance change a version, effective date, source notification and reviewer approval.

# 22. Final recommended product strategy

Build Quantum GST as one platform with four independently expandable engines:

GST Engine

Tax calculations, invoicing and compliance rules.

Import Engine

Marketplace reports, data normalization and reconciliation.

Integration Engine

Shopify, custom APIs, WooCommerce and other connectors.

Accounting Engine

Ledgers, payments, inventory and financial reports.

This architecture makes it possible to add more marketplace connectors, GSP providers and accounting functionality without rewriting the invoice generation system.

The first technical deliverable should be the complete PostgreSQL schema and Laravel migration package, followed by the GST engine and billing module. That establishes the foundation for everything else.

I would suggest generating the next development artifact as a complete implementation-ready project specification containing:

1. Full PostgreSQL SQL schema with foreign keys, indexes, unique constraints and tenant isolation.
2. Laravel migrations and Eloquent relationships.
3. API route definitions and request/response contracts.
4. GST calculation service classes.
5. Marketplace adapter interfaces.
6. Shopify GraphQL integration classes.
7. React screen-by-screen component specification.
8. Seeders, sample data and automated test cases.

This will turn the Quantum GST blueprint into a practical development handoff rather than just a product requirements document.