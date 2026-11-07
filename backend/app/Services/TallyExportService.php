<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\PurchaseBill;
use Carbon\Carbon;
use SimpleXMLElement;

class TallyExportService
{
    /**
     * Escape XML special characters.
     */
    protected function xmlEscape(string $str): string
    {
        return htmlspecialchars($str, ENT_XML1, 'UTF-8');
    }

    /**
     * Format date to Tally standard YYYYMMDD.
     */
    protected function formatDate(?string $date): string
    {
        if (empty($date)) {
            return Carbon::today()->format('Ymd');
        }
        return Carbon::parse($date)->format('Ymd');
    }

    /**
     * Export complete company data (Masters + Vouchers) for Tally Prime / Tally ERP 9.
     */
    public function exportAll(string $businessId, ?string $fromDate = null, ?string $toDate = null): string
    {
        $business = Business::findOrFail($businessId);
        $companyName = $this->xmlEscape($business->trade_name ?: $business->legal_name);

        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        $xml .= "<ENVELOPE>\n";
        $xml .= "  <HEADER>\n";
        $xml .= "    <TALLYREQUEST>Import Data</TALLYREQUEST>\n";
        $xml .= "  </HEADER>\n";
        $xml .= "  <BODY>\n";
        $xml .= "    <IMPORTDATA>\n";
        $xml .= "      <REQUESTDESC>\n";
        $xml .= "        <REPORTNAME>All Masters</REPORTNAME>\n";
        $xml .= "        <STATICVARIABLES>\n";
        $xml .= "          <SVCURRENTCOMPANY>{$companyName}</SVCURRENTCOMPANY>\n";
        $xml .= "        </STATICVARIABLES>\n";
        $xml .= "      </REQUESTDESC>\n";
        $xml .= "      <REQUESTDATA>\n";

        // 1. Standard Accounting Groups & Ledgers
        $xml .= $this->generateLedgerMasters($businessId);

        // 2. Stock Items
        $xml .= $this->generateStockItemMasters($businessId);

        // 3. Transactions (Sales & Purchases)
        $xml .= $this->generateVouchers($businessId, $fromDate, $toDate);

        $xml .= "      </REQUESTDATA>\n";
        $xml .= "    </IMPORTDATA>\n";
        $xml .= "  </BODY>\n";
        $xml .= "</ENVELOPE>";

        return $xml;
    }

    /**
     * Generate Tally XML for Ledger Masters (Customers, Suppliers, Tax Ledgers).
     */
    public function generateLedgerMasters(string $businessId): string
    {
        $xml = "";
        $customers = Customer::where('business_id', $businessId)->get();

        // Statutory tax and system ledgers
        $standardLedgers = [
            ['name' => 'Sales GST', 'parent' => 'Sales Accounts'],
            ['name' => 'Sales Exempt', 'parent' => 'Sales Accounts'],
            ['name' => 'Purchase GST', 'parent' => 'Purchase Accounts'],
            ['name' => 'CGST Output', 'parent' => 'Duties & Taxes'],
            ['name' => 'SGST Output', 'parent' => 'Duties & Taxes'],
            ['name' => 'IGST Output', 'parent' => 'Duties & Taxes'],
            ['name' => 'CGST Input', 'parent' => 'Duties & Taxes'],
            ['name' => 'SGST Input', 'parent' => 'Duties & Taxes'],
            ['name' => 'IGST Input', 'parent' => 'Duties & Taxes'],
            ['name' => 'Round Off', 'parent' => 'Indirect Expenses'],
        ];

        foreach ($standardLedgers as $leg) {
            $name = $this->xmlEscape($leg['name']);
            $parent = $this->xmlEscape($leg['parent']);
            $xml .= "        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n";
            $xml .= "          <LEDGER NAME=\"{$name}\" ACTION=\"Create\">\n";
            $xml .= "            <NAME>{$name}</NAME>\n";
            $xml .= "            <PARENT>{$parent}</PARENT>\n";
            $xml .= "            <ISBILLWISEON>No</ISBILLWISEON>\n";
            $xml .= "          </LEDGER>\n";
            $xml .= "        </TALLYMESSAGE>\n";
        }

        foreach ($customers as $c) {
            $name = $this->xmlEscape($c->company_name ?: $c->name);
            $parent = ($c->customer_type === 'supplier') ? 'Sundry Creditors' : 'Sundry Debtors';
            $gstin = $this->xmlEscape($c->gstin ?: 'URP');

            $xml .= "        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n";
            $xml .= "          <LEDGER NAME=\"{$name}\" ACTION=\"Create\">\n";
            $xml .= "            <NAME>{$name}</NAME>\n";
            $xml .= "            <PARENT>{$parent}</PARENT>\n";
            $xml .= "            <ISBILLWISEON>Yes</ISBILLWISEON>\n";
            $xml .= "            <PARTYGSTIN>{$gstin}</PARTYGSTIN>\n";
            if (!empty($c->billing_address)) {
                $xml .= "            <ADDRESS.LIST>\n";
                $xml .= "              <ADDRESS>" . $this->xmlEscape($c->billing_address) . "</ADDRESS>\n";
                $xml .= "            </ADDRESS.LIST>\n";
            }
            if (!empty($c->state_name)) {
                $xml .= "            <STATENAME>" . $this->xmlEscape($c->state_name) . "</STATENAME>\n";
            }
            if (!empty($c->billing_pincode)) {
                $xml .= "            <PINCODE>" . $this->xmlEscape($c->billing_pincode) . "</PINCODE>\n";
            }
            $xml .= "          </LEDGER>\n";
            $xml .= "        </TALLYMESSAGE>\n";
        }

        return $xml;
    }

    /**
     * Generate Stock Items for Tally XML.
     */
    public function generateStockItemMasters(string $businessId): string
    {
        $xml = "";
        $products = Product::where('business_id', $businessId)->with('taxCategory')->get();

        foreach ($products as $p) {
            $name = $this->xmlEscape($p->name);
            $unit = $this->xmlEscape($p->unit ?: 'NOS');
            $hsn = $this->xmlEscape($p->hsn_sac ?: '');
            $gstRate = '18.00';
            if ($p->taxCategory) {
                $gstRate = (string) ($p->taxCategory->igst_rate ?: bcadd($p->taxCategory->cgst_rate, $p->taxCategory->sgst_rate, 2));
            }

            $xml .= "        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n";
            $xml .= "          <STOCKITEM NAME=\"{$name}\" ACTION=\"Create\">\n";
            $xml .= "            <NAME>{$name}</NAME>\n";
            $xml .= "            <BASEUNITS>{$unit}</BASEUNITS>\n";
            $xml .= "            <HSNCODE>{$hsn}</HSNCODE>\n";
            $xml .= "            <GSTRATEDETAILS.LIST>\n";
            $xml .= "              <APPLICABLEFROM>20200401</APPLICABLEFROM>\n";
            $xml .= "              <GSTRATE>" . (float) $gstRate . "</GSTRATE>\n";
            $xml .= "            </GSTRATEDETAILS.LIST>\n";
            $xml .= "          </STOCKITEM>\n";
            $xml .= "        </TALLYMESSAGE>\n";
        }

        return $xml;
    }

    /**
     * Generate Sales & Purchase Vouchers in Tally XML.
     */
    public function generateVouchers(string $businessId, ?string $fromDate = null, ?string $toDate = null): string
    {
        $xml = "";

        // 1. Sales Invoices
        $invoicesQuery = Invoice::where('business_id', $businessId)->with(['customer', 'items']);
        if ($fromDate) {
            $invoicesQuery->where('invoice_date', '>=', $fromDate);
        }
        if ($toDate) {
            $invoicesQuery->where('invoice_date', '<=', $toDate);
        }
        $invoices = $invoicesQuery->get();

        foreach ($invoices as $inv) {
            $date = $this->formatDate($inv->invoice_date);
            $invNum = $this->xmlEscape($inv->invoice_number);
            $partyName = $this->xmlEscape($inv->customer ? ($inv->customer->company_name ?: $inv->customer->name) : 'Cash Sales');

            $xml .= "        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n";
            $xml .= "          <VOUCHER VCHTYPE=\"Sales\" ACTION=\"Create\">\n";
            $xml .= "            <DATE>{$date}</DATE>\n";
            $xml .= "            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n";
            $xml .= "            <VOUCHERNUMBER>{$invNum}</VOUCHERNUMBER>\n";
            $xml .= "            <PARTYLEDGERNAME>{$partyName}</PARTYLEDGERNAME>\n";
            $xml .= "            <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>\n";

            // Debtor Entry (Total Gross Receivable) - In Tally debits are negative
            $grossAmt = '-' . bcdiv($inv->grand_total, '1', 2);
            $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
            $xml .= "              <LEDGERNAME>{$partyName}</LEDGERNAME>\n";
            $xml .= "              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n";
            $xml .= "              <AMOUNT>{$grossAmt}</AMOUNT>\n";
            $xml .= "            </ALLLEDGERENTRIES.LIST>\n";

            // Sales Account Entry (Net Taxable Revenue) - Credits are positive
            $taxableAmt = bcdiv($inv->total_taxable_value, '1', 2);
            $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
            $xml .= "              <LEDGERNAME>Sales GST</LEDGERNAME>\n";
            $xml .= "              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n";
            $xml .= "              <AMOUNT>{$taxableAmt}</AMOUNT>\n";
            $xml .= "            </ALLLEDGERENTRIES.LIST>\n";

            // Output Tax Entries
            if (bccomp($inv->total_cgst, '0.00', 2) > 0) {
                $cgstAmt = bcdiv($inv->total_cgst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>CGST Output</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$cgstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }
            if (bccomp($inv->total_sgst, '0.00', 2) > 0) {
                $sgstAmt = bcdiv($inv->total_sgst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>SGST Output</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$sgstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }
            if (bccomp($inv->total_igst, '0.00', 2) > 0) {
                $igstAmt = bcdiv($inv->total_igst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>IGST Output</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$igstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }

            // Round Off Entry if any
            if (bccomp($inv->round_off ?? '0.00', '0.00', 2) !== 0) {
                $roundAmt = bcdiv($inv->round_off, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>Round Off</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>" . (bccomp($roundAmt, '0.00', 2) < 0 ? 'Yes' : 'No') . "</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$roundAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }

            $xml .= "          </VOUCHER>\n";
            $xml .= "        </TALLYMESSAGE>\n";
        }

        // 2. Purchase Bills
        $purchasesQuery = PurchaseBill::where('business_id', $businessId)->with(['supplier', 'items']);
        if ($fromDate) {
            $purchasesQuery->where('bill_date', '>=', $fromDate);
        }
        if ($toDate) {
            $purchasesQuery->where('bill_date', '<=', $toDate);
        }
        $purchases = $purchasesQuery->get();

        foreach ($purchases as $bill) {
            $date = $this->formatDate($bill->bill_date);
            $billNum = $this->xmlEscape($bill->bill_number);
            $supplierName = $this->xmlEscape($bill->supplier ? ($bill->supplier->company_name ?: $bill->supplier->name) : 'Cash Supplier');

            $xml .= "        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">\n";
            $xml .= "          <VOUCHER VCHTYPE=\"Purchase\" ACTION=\"Create\">\n";
            $xml .= "            <DATE>{$date}</DATE>\n";
            $xml .= "            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>\n";
            $xml .= "            <VOUCHERNUMBER>{$billNum}</VOUCHERNUMBER>\n";
            $xml .= "            <PARTYLEDGERNAME>{$supplierName}</PARTYLEDGERNAME>\n";

            // Purchase Expense (Taxable Value) - Debit (negative)
            $taxableAmt = '-' . bcdiv($bill->total_taxable_value, '1', 2);
            $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
            $xml .= "              <LEDGERNAME>Purchase GST</LEDGERNAME>\n";
            $xml .= "              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n";
            $xml .= "              <AMOUNT>{$taxableAmt}</AMOUNT>\n";
            $xml .= "            </ALLLEDGERENTRIES.LIST>\n";

            // Input Tax Entries - Debit (negative)
            if (bccomp($bill->total_cgst, '0.00', 2) > 0) {
                $cgstAmt = '-' . bcdiv($bill->total_cgst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>CGST Input</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$cgstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }
            if (bccomp($bill->total_sgst, '0.00', 2) > 0) {
                $sgstAmt = '-' . bcdiv($bill->total_sgst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>SGST Input</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$sgstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }
            if (bccomp($bill->total_igst, '0.00', 2) > 0) {
                $igstAmt = '-' . bcdiv($bill->total_igst, '1', 2);
                $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
                $xml .= "              <LEDGERNAME>IGST Input</LEDGERNAME>\n";
                $xml .= "              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n";
                $xml .= "              <AMOUNT>{$igstAmt}</AMOUNT>\n";
                $xml .= "            </ALLLEDGERENTRIES.LIST>\n";
            }

            // Creditor Entry (Payable) - Credit (positive)
            $payableAmt = bcdiv($bill->grand_total, '1', 2);
            $xml .= "            <ALLLEDGERENTRIES.LIST>\n";
            $xml .= "              <LEDGERNAME>{$supplierName}</LEDGERNAME>\n";
            $xml .= "              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n";
            $xml .= "              <AMOUNT>{$payableAmt}</AMOUNT>\n";
            $xml .= "            </ALLLEDGERENTRIES.LIST>\n";

            $xml .= "          </VOUCHER>\n";
            $xml .= "        </TALLYMESSAGE>\n";
        }

        return $xml;
    }
}
