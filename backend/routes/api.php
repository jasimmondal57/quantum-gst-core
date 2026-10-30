<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\GstinController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\GstReportController;
use App\Http\Controllers\Api\MarketplaceImportController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\ProductController;
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

        // Marketplace Report Ingestion
        Route::post('/marketplace/import', [MarketplaceImportController::class, 'import']);
        Route::get('/marketplace/orders', [MarketplaceImportController::class, 'orders']);

        // GST Compliance & Statutory Reports
        Route::get('/reports/gstr1', [GstReportController::class, 'gstr1']);
    });
});
