<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ ucwords(str_replace('_', ' ', $note->note_type)) }} - {{ $note->note_number }}</title>
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
        .note-title {
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
        .info-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            padding: 10px;
            border-radius: 4px;
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
            padding: 6px;
            font-size: 10px;
        }
        .items-table td {
            padding: 6px;
            border-bottom: 1px solid #E2E8F0;
        }
        .totals-table {
            width: 45%;
            margin-left: 55%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 4px 6px;
        }
        .text-right {
            text-align: right;
        }
        .bold {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 50%;">
                <h1 class="brand-title">{{ $note->businessGstin->legal_name ?? 'Quantum GST Merchant' }}</h1>
                <p style="margin: 3px 0; color: #475569;">
                    GSTIN: <strong>{{ $note->businessGstin->gstin }}</strong><br>
                    State: {{ $note->businessGstin->state_name }} ({{ $note->businessGstin->state_code }})
                </p>
            </td>
            <td style="width: 50%;">
                <h2 class="note-title">{{ str_replace('_', ' ', strtoupper($note->note_type)) }}</h2>
                <p class="text-right" style="margin: 3px 0;">
                    Note Number: <strong>{{ $note->note_number }}</strong><br>
                    Date of Issue: {{ \Carbon\Carbon::parse($note->note_date)->format('d M, Y') }}<br>
                    Original Tax Invoice: <strong>{{ $note->originalInvoice->invoice_number }}</strong><br>
                    Original Invoice Date: {{ \Carbon\Carbon::parse($note->originalInvoice->invoice_date)->format('d M, Y') }}
                </p>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                <div class="info-box">
                    <strong style="color: #123B73;">Bill To (Customer):</strong><br>
                    <span style="font-size: 12px; font-weight: bold;">{{ $note->originalInvoice->customer->name ?? 'Cash Customer' }}</span><br>
                    @if(!empty($note->originalInvoice->customer->gstin))
                        GSTIN: <strong>{{ $note->originalInvoice->customer->gstin }}</strong><br>
                    @endif
                    Place of Supply: {{ $note->originalInvoice->place_of_supply_state_code }}
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                <div class="info-box">
                    <strong style="color: #123B73;">Statutory Reason for Adjustment:</strong><br>
                    <span style="font-size: 11px;">{{ $note->reason }}</span><br>
                    Status: <strong style="color: #059669;">{{ strtoupper($note->status) }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description / Reason</th>
                <th class="text-right">Adjusted Taxable (₹)</th>
                <th class="text-right">CGST (₹)</th>
                <th class="text-right">SGST/UTGST (₹)</th>
                <th class="text-right">IGST (₹)</th>
                <th class="text-right">Total Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $note->reason }}</td>
                <td class="text-right">{{ number_format($note->taxable_value, 2) }}</td>
                <td class="text-right">{{ number_format($note->cgst_amount, 2) }}</td>
                <td class="text-right">{{ number_format($note->sgst_amount, 2) }}</td>
                <td class="text-right">{{ number_format($note->igst_amount, 2) }}</td>
                <td class="text-right bold">{{ number_format($note->total_amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Taxable Turnover Adjusted:</td>
            <td class="text-right bold">₹ {{ number_format($note->taxable_value, 2) }}</td>
        </tr>
        @if($note->cgst_amount > 0)
        <tr>
            <td>Total CGST Adjusted:</td>
            <td class="text-right">₹ {{ number_format($note->cgst_amount, 2) }}</td>
        </tr>
        @endif
        @if($note->sgst_amount > 0)
        <tr>
            <td>Total SGST/UTGST Adjusted:</td>
            <td class="text-right">₹ {{ number_format($note->sgst_amount, 2) }}</td>
        </tr>
        @endif
        @if($note->igst_amount > 0)
        <tr>
            <td>Total IGST Adjusted:</td>
            <td class="text-right">₹ {{ number_format($note->igst_amount, 2) }}</td>
        </tr>
        @endif
        <tr style="border-top: 1px solid #123B73; border-bottom: 2px solid #123B73;">
            <td class="bold" style="font-size: 13px;">Total Adjusted Value:</td>
            <td class="text-right bold" style="font-size: 13px; color: #123B73;">₹ {{ number_format($note->total_amount, 2) }}</td>
        </tr>
    </table>

    <div style="margin-top: 40px; border-top: 1px solid #CBD5E1; padding-top: 10px;">
        <p style="font-size: 9px; color: #64748B; text-align: center;">
            This document is a statutory {{ ucwords(str_replace('_', ' ', $note->note_type)) }} issued in accordance with Section 34 of the CGST/SGST Act, 2017.
        </p>
    </div>
</body>
</html>

