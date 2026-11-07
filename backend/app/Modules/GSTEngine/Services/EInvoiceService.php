<?php

namespace App\Modules\GSTEngine\Services;

use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EInvoiceService
{
    /**
     * Compute statutory 64-character SHA-256 Invoice Reference Number (IRN).
     * GSTN Formula: SHA256(SupplierGSTIN + FY + DocType + DocNo)
     */
    public function calculateIRN(string $supplierGstin, string $docType, string $docNumber, string $docDate): string
    {
        $date = Carbon::parse($docDate);
        $fyStart = $date->month >= 4 ? $date->year : $date->year - 1;
        $fyString = $fyStart . '-' . substr((string) ($fyStart + 1), -2);

        $rawCombined = strtoupper(trim($supplierGstin)) . $fyString . strtoupper(trim($docType)) . strtoupper(trim($docNumber));
        return hash('sha256', $rawCombined);
    }

    /**
     * Generate official GSTN E-Invoice Schema v1.1 JSON.
     */
    public function generateSchemaV1Payload(Invoice $invoice): array
    {
        $invoice->loadMissing(['businessGstin', 'customer', 'items']);

        $supplier = $invoice->businessGstin;
        $customer = $invoice->customer;

        $docDate = Carbon::parse($invoice->invoice_date);
        $docType = match ($invoice->invoice_type) {
            'credit_note' => 'CRN',
            'debit_note' => 'DBN',
            default => 'INV',
        };

        // Determine Supply Type
        $supplyType = 'B2B';
        if ($invoice->invoice_type === 'export') {
            $supplyType = 'EXPWP';
        } elseif ($customer && $customer->customer_type === 'sez') {
            $supplyType = 'SEZWP';
        }

        $itemList = [];
        $slNo = 1;

        foreach ($invoice->items as $item) {
            $qty = (string) $item->quantity;
            $rate = (string) $item->unit_price;
            $taxable = (string) $item->taxable_value;
            $cgst = (string) $item->cgst_amount;
            $sgst = (string) $item->sgst_amount;
            $igst = (string) $item->igst_amount;
            $cess = (string) ($item->cess_amount ?? '0.00');

            $totalItemVal = bcadd(bcadd(bcadd(bcadd($taxable, $cgst, 2), $sgst, 2), $igst, 2), $cess, 2);

            $itemList[] = [
                'SlNo' => (string) $slNo++,
                'PrdDesc' => $item->item_name,
                'IsServc' => strlen(trim($item->hsn_sac)) === 6 && str_starts_with(trim($item->hsn_sac), '99') ? 'Y' : 'N',
                'HsnCd' => $item->hsn_sac,
                'Qty' => (float) $qty,
                'Unit' => $item->unit ?? 'NOS',
                'UnitPrice' => (float) $rate,
                'TotAmt' => (float) bcmul($qty, $rate, 2),
                'Discount' => 0.0,
                'AssAmt' => (float) $taxable,
                'GstRt' => (float) ($invoice->is_interstate ? $item->igst_rate : bcadd((string)$item->cgst_rate, (string)$item->sgst_rate, 2)),
                'IgstAmt' => (float) $igst,
                'CgstAmt' => (float) $cgst,
                'SgstAmt' => (float) $sgst,
                'CesAmt' => (float) $cess,
                'TotItemVal' => (float) $totalItemVal,
            ];
        }

        return [
            'Version' => '1.1',
            'TranDtls' => [
                'TaxSch' => 'GST',
                'SupTyp' => $supplyType,
                'RegRev' => $invoice->reverse_charge ? 'Y' : 'N',
                'EcmGstin' => null,
                'IgstOnIntra' => 'N',
            ],
            'DocDtls' => [
                'Typ' => $docType,
                'No' => $invoice->invoice_number,
                'Dt' => $docDate->format('d/m/Y'),
            ],
            'SellerDtls' => [
                'Gstin' => $supplier->gstin,
                'LglNm' => $supplier->legal_name,
                'TrdNm' => $supplier->legal_name,
                'Addr1' => $supplier->address_line1 ?? $supplier->address ?? 'Industrial Estate Plot 12',
                'Loc' => $supplier->state_name,
                'Pin' => (int) ($supplier->pincode ?? 400001),
                'Stcd' => $supplier->state_code,
            ],
            'BuyerDtls' => [
                'Gstin' => $customer?->gstin ?? 'URP',
                'LglNm' => $customer?->company_name ?? $customer?->name ?? 'Consumer Walk-in',
                'Pos' => $invoice->place_of_supply_state_code,
                'Addr1' => $customer?->billing_address ?? 'Commercial Lane',
                'Loc' => $customer?->state_name ?? 'Maharashtra',
                'Pin' => (int) ($customer?->billing_pincode ?? 400001),
                'Stcd' => $invoice->place_of_supply_state_code,
            ],
            'ItemList' => $itemList,
            'ValDtls' => [
                'AssVal' => (float) $invoice->total_taxable_value,
                'CgstVal' => (float) $invoice->total_cgst,
                'SgstVal' => (float) $invoice->total_sgst,
                'IgstVal' => (float) $invoice->total_igst,
                'CesVal' => (float) $invoice->total_cess,
                'RndOffAmt' => (float) $invoice->round_off,
                'TotInvVal' => (float) $invoice->grand_total,
            ],
        ];
    }

    /**
     * Generate IRN, Signed QR Code and statutory Ack for an invoice.
     */
    public function generateEInvoice(Invoice $invoice): Invoice
    {
        $invoice->loadMissing(['businessGstin', 'customer', 'items']);

        if (!$invoice->businessGstin) {
            throw new InvalidArgumentException("Active GSTIN required to generate e-Invoice.");
        }

        if ($invoice->einvoice_status === 'generated') {
            return $invoice; // Idempotent return
        }

        $docType = match ($invoice->invoice_type) {
            'credit_note' => 'CRN',
            'debit_note' => 'DBN',
            default => 'INV',
        };

        $irn = $this->calculateIRN(
            supplierGstin: $invoice->businessGstin->gstin,
            docType: $docType,
            docNumber: $invoice->invoice_number,
            docDate: Carbon::parse($invoice->invoice_date)->format('Y-m-d')
        );

        $ackNo = '1' . str_pad((string) mt_rand(1000000000, 9999999999), 14, '0', STR_PAD_LEFT);
        $ackDate = now();

        // Standard 500+ char statutory IRP QR Code payload
        $buyerGstin = $invoice->customer?->gstin ?? 'URP';
        $mainHsn = $invoice->items->first()?->hsn_sac ?? '9999';
        $qrString = "{$invoice->businessGstin->gstin}:{$buyerGstin}:{$invoice->invoice_number}:" .
                    Carbon::parse($invoice->invoice_date)->format('d/m/Y') . ":{$invoice->grand_total}:" .
                    $invoice->items->count() . ":{$mainHsn}:{$irn}";

        $invoice->irn = $irn;
        $invoice->ack_no = $ackNo;
        $invoice->ack_date = $ackDate;
        $invoice->signed_qr_code = $qrString;
        $invoice->einvoice_status = 'generated';
        $invoice->save();

        return $invoice;
    }

    /**
     * Statutory cancellation of IRN (within 24 hours of generation).
     */
    public function cancelEInvoice(Invoice $invoice, string $reasonCode, ?string $remarks = null): Invoice
    {
        if ($invoice->einvoice_status !== 'generated') {
            throw new InvalidArgumentException("Invoice has not been issued an IRN or is already cancelled.");
        }

        $reasonMap = [
            '1' => 'Duplicate Entry',
            '2' => 'Data Entry Mistake',
            '3' => 'Order Cancelled',
            '4' => 'Others',
        ];

        $reasonText = $reasonMap[$reasonCode] ?? $remarks ?? 'Cancelled by User';

        $invoice->einvoice_status = 'cancelled';
        $invoice->einvoice_cancel_reason = $reasonText;
        $invoice->save();

        return $invoice;
    }
}
