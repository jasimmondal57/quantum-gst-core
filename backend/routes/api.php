<?php

use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CreditDebitNoteController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EInvoiceController;
use App\Http\Controllers\Api\EWayBillController;
use App\Http\Controllers\Api\GstinController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\GstReportController;
use App\Http\Controllers\Api\ManufacturingController;
use App\Http\Controllers\Api\MarketplaceImportController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ShopifyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Quantum GST REST API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Auth & Onboarding
    Route::get('/onboarding/status', [OnboardingController::class, 'checkStatus']);
    Route::post('/onboarding/complete', [OnboardingController::class, 'completeSetup']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public Shopify Webhook Gateway (Automated Invoicing)
    Route::post('/webhooks/shopify/orders-create', [ShopifyController::class, 'handleOrderWebhook']);

    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Businesses Master (Multi-company)
        Route::get('/businesses', [BusinessController::class, 'index']);
        Route::post('/businesses', [BusinessController::class, 'store']);

        // GSTIN Registrations
        Route::get('/gstins', [GstinController::class, 'index']);
        Route::post('/gstins', [GstinController::class, 'store']);

        // Customers Master
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);

        // Products Master
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);

        // Statutory GST Invoices
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);

        // Statutory Credit & Debit Notes
        Route::get('/credit-debit-notes', [CreditDebitNoteController::class, 'index']);
        Route::post('/credit-debit-notes', [CreditDebitNoteController::class, 'store']);
        Route::get('/credit-debit-notes/{id}', [CreditDebitNoteController::class, 'show']);
        Route::get('/credit-debit-notes/{id}/pdf', [CreditDebitNoteController::class, 'downloadPdf']);

        // Inward Purchases & ITC Ledger
        Route::get('/purchases', [PurchaseController::class, 'index']);
        Route::post('/purchases', [PurchaseController::class, 'store']);
        Route::get('/purchases/{id}', [PurchaseController::class, 'show']);

        // Marketplace Report Ingestion
        Route::post('/marketplace/import', [MarketplaceImportController::class, 'import']);
        Route::get('/marketplace/orders', [MarketplaceImportController::class, 'orders']);
        Route::get('/marketplace/reconciliation', [MarketplaceImportController::class, 'reconciliation']);

        // GST Compliance & Statutory Reports
        Route::get('/reports/gstr1', [GstReportController::class, 'gstr1']);
        Route::get('/reports/gstr3b', [GstReportController::class, 'gstr3b']);
        Route::post('/reports/gstr2b-reconcile', [GstReportController::class, 'gstr2bReconcile']);
        Route::get('/reports/gstr9', [GstReportController::class, 'gstr9']);

        // Double-Entry Accounting & Financial Statements
        Route::prefix('accounting')->group(function () {
            Route::get('/accounts', [AccountingController::class, 'accounts']);
            Route::post('/accounts', [AccountingController::class, 'storeAccount']);
            Route::get('/journal-entries', [AccountingController::class, 'journalEntries']);
            Route::post('/journal-entries', [AccountingController::class, 'postJournalEntry']);
            Route::get('/payments', [AccountingController::class, 'paymentVouchers']);
            Route::post('/payments', [AccountingController::class, 'storePaymentVoucher']);
            Route::get('/trial-balance', [AccountingController::class, 'trialBalance']);
            Route::get('/profit-loss', [AccountingController::class, 'profitLoss']);
            Route::get('/balance-sheet', [AccountingController::class, 'balanceSheet']);
            Route::get('/ledgers', [AccountingController::class, 'partyLedger']);
        });

        // Manufacturing, BOM, Production Orders & Godowns
        Route::prefix('manufacturing')->group(function () {
            Route::get('/godowns', [ManufacturingController::class, 'godowns']);
            Route::post('/godowns', [ManufacturingController::class, 'storeGodown']);
            Route::get('/godowns/{id}/stock', [ManufacturingController::class, 'godownStock']);
            Route::get('/boms', [ManufacturingController::class, 'boms']);
            Route::post('/boms', [ManufacturingController::class, 'storeBom']);
            Route::get('/boms/{id}/costing', [ManufacturingController::class, 'bomCosting']);
            Route::get('/production-orders', [ManufacturingController::class, 'productionOrders']);
            Route::post('/production-orders', [ManufacturingController::class, 'storeProductionOrder']);
            Route::post('/production-orders/{id}/start', [ManufacturingController::class, 'startProductionOrder']);
            Route::post('/production-orders/{id}/complete', [ManufacturingController::class, 'completeProductionOrder']);
            Route::get('/stock-transfers', [ManufacturingController::class, 'stockTransfers']);
            Route::post('/stock-transfers', [ManufacturingController::class, 'storeStockTransfer']);
        });

        // Statutory e-Invoicing (IRN & Signed QR Code - Rule 48(4))
        Route::prefix('einvoice')->group(function () {
            Route::post('/generate', [EInvoiceController::class, 'generate']);
            Route::get('/{id}/json', [EInvoiceController::class, 'jsonSchema']);
            Route::post('/{id}/cancel', [EInvoiceController::class, 'cancel']);
        });

        // Statutory E-Way Bills (Rule 138)
        Route::prefix('eway')->group(function () {
            Route::get('/', [EWayBillController::class, 'index']);
            Route::post('/generate', [EWayBillController::class, 'generateForInvoice']);
            Route::post('/generate-transfer', [EWayBillController::class, 'generateForStockTransfer']);
            Route::get('/{id}', [EWayBillController::class, 'show']);
            Route::post('/{id}/update-vehicle', [EWayBillController::class, 'updateVehicle']);
            Route::post('/{id}/cancel', [EWayBillController::class, 'cancel']);
        });
    });
});
