<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Tax Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
            color: #172033;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
        }
        .header-table {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #1D5FBF;
            padding-bottom: 12px;
        }
        .brand-title {
            font-size: 22px;
            font-weight: bold;
            color: #123B73;
            margin: 0;
        }
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            color: #1D5FBF;
            margin: 0;
            text-transform: uppercase;
        }
        .info-table {
            width: 100%;
            margin-bottom: 15px;
        }
        .info-table td {
            vertical-align: top;
            width: 50%;
        }
        .section-box {
            background-color: #F4F7FB;
            border: 1px solid #D8DFE9;
            padding: 10px;
            border-radius: 4px;
        }
        .section-title {
            font-weight: bold;
            color: #123B73;
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table th {
            background-color: #123B73;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 6px 8px;
            font-size: 10px;
            text-transform: uppercase;
        }
        .items-table td {
            border-bottom: 1px solid #E8EDF4;
            padding: 6px 8px;
            font-size: 10px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .totals-table td {
            vertical-align: top;
        }
        .grand-total-box {
            background-color: #EAF2FF;
            border: 1px solid #1D5FBF;
            padding: 8px 12px;
            border-radius: 4px;
            text-align: right;
        }
        .footer {
            margin-top: 30px;
            border-top: 1px solid #D8DFE9;
            padding-top: 10px;
            font-size: 9px;
            color: #718096;
            text-align: center;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 3px;
            background-color: #E2F7F3;
            color: #0D9F91;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="vertical-align: middle;">
                <h1 class="brand-title">{{ $invoice->business->legal_name }}</h1>
                <div style="color: #718096; font-size: 10px;">{{ $invoice->business->trade_name }}</div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
                <h2 class="invoice-title">TAX INVOICE</h2>
                <div style="margin-top: 4px;">
                    <strong>Invoice #:</strong> {{ $invoice->invoice_number }}<br>
                    <strong>Date:</strong> {{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d-m-Y') }}<br>
                    <span class="badge">{{ $invoice->is_interstate ? 'INTER-STATE (IGST)' : 'INTRA-STATE (CGST + SGST)' }}</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="info-table" cellspacing="8">
        <tr>
            <td>
                <div class="section-box">
                    <div class="section-title">Supplier Details</div>
                    <strong>{{ $invoice->businessGstin->legal_name }}</strong><br>
                    <strong>GSTIN:</strong> {{ $invoice->businessGstin->gstin }}<br>
                    <strong>State:</strong> {{ $invoice->businessGstin->state_name }} (Code: {{ $invoice->businessGstin->state_code }})<br>
                    @if($invoice->businessGstin->address_line1)
                        {{ $invoice->businessGstin->address_line1 }}<br>
                    @endif
                    @if($invoice->businessGstin->city)
                        {{ $invoice->businessGstin->city }} - {{ $invoice->businessGstin->pincode }}
                    @endif
                </div>
            </td>
            <td>
                <div class="section-box">
                    <div class="section-title">Recipient / Billed To</div>
                    @if($invoice->customer)
                        <strong>{{ $invoice->customer->name }}</strong><br>
                        @if($invoice->customer->company_name)
                            {{ $invoice->customer->company_name }}<br>
                        @endif
                        <strong>GSTIN:</strong> {{ $invoice->customer->gstin ?? 'URP (Unregistered)' }}<br>
                        <strong>Place of Supply:</strong> State Code {{ $invoice->place_of_supply_state_code }}<br>
                        @if($invoice->customer->billing_address)
                            {{ $invoice->customer->billing_address }}
                        @endif
                    @else
                        <strong>Cash Customer / Counter Sale</strong><br>
                        <strong>Place of Supply:</strong> State Code {{ $invoice->place_of_supply_state_code }}
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25px;">#</th>
                <th>Item Description</th>
                <th style="width: 60px;" class="text-center">HSN/SAC</th>
                <th style="width: 40px;" class="text-center">Qty</th>
                <th style="width: 65px;" class="text-right">Unit Price</th>
                <th style="width: 75px;" class="text-right">Taxable Val</th>
                @if($invoice->is_interstate)
                    <th style="width: 70px;" class="text-right">IGST</th>
                @else
                    <th style="width: 60px;" class="text-right">CGST</th>
                    <th style="width: 60px;" class="text-right">SGST</th>
                @endif
                <th style="width: 80px;" class="text-right">Total (₹)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>
                    <strong>{{ $item->item_name }}</strong>
                </td>
                <td class="text-center">{{ $item->hsn_sac }}</td>
                <td class="text-center">{{ (float) $item->quantity }} {{ $item->unit }}</td>
                <td class="text-right">{{ number_format($item->unit_price, 2) }}</td>
                <td class="text-right">{{ number_format($item->taxable_value, 2) }}</td>
                @if($invoice->is_interstate)
                    <td class="text-right">
                        {{ number_format($item->igst_amount, 2) }}<br>
                        <span style="font-size: 8px; color: #718096;">({{ (float)$item->igst_rate }}%)</span>
                    </td>
                @else
                    <td class="text-right">
                        {{ number_format($item->cgst_amount, 2) }}<br>
                        <span style="font-size: 8px; color: #718096;">({{ (float)$item->cgst_rate }}%)</span>
                    </td>
                    <td class="text-right">
                        {{ number_format($item->sgst_amount, 2) }}<br>
                        <span style="font-size: 8px; color: #718096;">({{ (float)$item->sgst_rate }}%)</span>
                    </td>
                @endif
                <td class="text-right"><strong>{{ number_format($item->total_amount, 2) }}</strong></td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td style="width: 55%; padding-right: 15px;">
                <div style="font-size: 10px; color: #46536A; line-height: 1.6;">
                    <strong>Terms & Declarations:</strong><br>
                    1. We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.<br>
                    2. Electronic Tax Invoice generated under Section 31 of the CGST Act, 2017.
                </div>
            </td>
            <td style="width: 45%;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <tr>
                        <td style="padding: 3px 0;">Total Taxable Value:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->total_taxable_value, 2) }}</td>
                    </tr>
                    @if($invoice->is_interstate)
                    <tr>
                        <td style="padding: 3px 0;">Total IGST:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->total_igst, 2) }}</td>
                    </tr>
                    @else
                    <tr>
                        <td style="padding: 3px 0;">Total CGST:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->total_cgst, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0;">Total SGST:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->total_sgst, 2) }}</td>
                    </tr>
                    @endif
                    @if($invoice->total_cess > 0)
                    <tr>
                        <td style="padding: 3px 0;">Total Cess:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->total_cess, 2) }}</td>
                    </tr>
                    @endif
                    @if($invoice->round_off != 0)
                    <tr>
                        <td style="padding: 3px 0;">Round Off:</td>
                        <td style="padding: 3px 0;" class="text-right">₹{{ number_format($invoice->round_off, 2) }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td colspan="2" style="padding-top: 8px;">
                            <div class="grand-total-box">
                                <span style="font-size: 11px; text-transform: uppercase;">Grand Total:</span>
                                <strong style="font-size: 16px; color: #123B73; margin-left: 8px;">
                                    ₹{{ number_format($invoice->grand_total, 2) }}
                                </strong>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer">
        Generated by <strong>Quantum GST</strong> — Cloud GST Billing & Automation · https://quantumgst.in
    </div>

</body>
</html>

