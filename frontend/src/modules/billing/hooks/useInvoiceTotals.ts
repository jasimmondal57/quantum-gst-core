import { useMemo } from "react";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { AdditionalCharge, SupplyType } from "../types/invoice";
import { calculateItemRowTaxes } from "../utils/taxCalculation";

export const UT_STATE_CODES = ["04", "26", "31", "35", "38", "97"]; // Chandigarh, DNH&DD, Lakshadweep, A&N, Ladakh, Other

export interface CalculateTotalsParams {
  items: InvoiceItemDraft[];
  businessStateCode: string;
  placeOfSupplyStateCode: string;
  supplyType: SupplyType;
  reverseCharge: boolean;
  invoiceDiscountType: "percentage" | "fixed";
  invoiceDiscountValue: number;
  additionalCharges: AdditionalCharge[];
}

export interface CalculatedTotals {
  subtotal: number;
  totalItemDiscount: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalUtgst: number;
  totalIgst: number;
  totalCess: number;
  totalTaxAmount: number;
  chargesTotal: number;
  chargesTax: number;
  roundOff: number;
  grandTotal: number;
  isInterstate: boolean;
  isUtgst: boolean;
  calculatedItems: InvoiceItemDraft[];
}

// Decimal helper to round to 2 decimal places safely
function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function useInvoiceTotals(params: CalculateTotalsParams): CalculatedTotals {
  return useMemo(() => {
    const {
      items,
      businessStateCode,
      placeOfSupplyStateCode,
      supplyType,
      reverseCharge,
      invoiceDiscountType,
      invoiceDiscountValue,
      additionalCharges,
    } = params;

    const isZeroRated = [
      "export_without_tax",
      "sez_without_tax",
      "nil_rated",
      "exempt",
      "non_gst",
    ].includes(supplyType);

    const isInterstate =
      businessStateCode !== placeOfSupplyStateCode ||
      supplyType === "export_with_tax" ||
      supplyType === "sez_with_tax";

    const isUtgst = !isInterstate && UT_STATE_CODES.includes(businessStateCode);

    // Pass 1: Line Item Base Calculations (Zero Double Deduction)
    let grossSubtotal = 0;
    let totalItemDiscount = 0;
    let unadjustedTaxableTotal = 0;

    const rowCalcs = items.map((item) => {
      const calc = calculateItemRowTaxes({
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        gst_rate: isZeroRated ? 0 : item.gst_rate,
        tax_inclusive: item.tax_inclusive,
        cess_rate: isZeroRated ? 0 : item.cess_rate,
        cess_specific: isZeroRated ? 0 : item.cess_specific,
      });

      grossSubtotal += calc.gross;
      totalItemDiscount += calc.itemDiscount;
      unadjustedTaxableTotal += calc.taxableValue;

      return calc;
    });

    grossSubtotal = round2(grossSubtotal);
    totalItemDiscount = round2(totalItemDiscount);
    unadjustedTaxableTotal = round2(unadjustedTaxableTotal);

    // Calculate invoice-level discount on unadjusted taxable base
    let invoiceDiscountAmount = 0;
    if (invoiceDiscountType === "percentage") {
      invoiceDiscountAmount = round2((unadjustedTaxableTotal * (invoiceDiscountValue || 0)) / 100);
    } else {
      invoiceDiscountAmount = round2(invoiceDiscountValue || 0);
    }
    if (invoiceDiscountAmount > unadjustedTaxableTotal) {
      invoiceDiscountAmount = unadjustedTaxableTotal;
    }

    // Pass 2: Proportionally allocate invoice discount across lines and compute statutory taxes
    let totalCgst = 0;
    let totalSgst = 0;
    let totalUtgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let remainingDiscountToAllocate = invoiceDiscountAmount;

    const calculatedItems = items.map((item, idx) => {
      const baseCalc = rowCalcs[idx];
      let lineDiscountAllocated = 0;

      if (invoiceDiscountAmount > 0 && unadjustedTaxableTotal > 0) {
        if (idx === items.length - 1) {
          // Last line absorbs any 1-paisa rounding difference
          lineDiscountAllocated = round2(remainingDiscountToAllocate);
        } else {
          lineDiscountAllocated = round2(
            (baseCalc.taxableValue / unadjustedTaxableTotal) * invoiceDiscountAmount
          );
          if (lineDiscountAllocated > remainingDiscountToAllocate) {
            lineDiscountAllocated = remainingDiscountToAllocate;
          }
          remainingDiscountToAllocate = round2(remainingDiscountToAllocate - lineDiscountAllocated);
        }
      }

      const adjustedTaxableValue = round2(Math.max(0, baseCalc.taxableValue - lineDiscountAllocated));

      // Calculate taxes on adjusted taxable value
      const gstRate = isZeroRated ? 0 : (Number(item.gst_rate) || 0);
      const cessRate = isZeroRated ? 0 : (Number(item.cess_rate) || 0);
      const cessSpecificPerUnit = isZeroRated ? 0 : (Number(item.cess_specific) || 0);
      const specificCess = round2((Number(item.quantity) || 0) * cessSpecificPerUnit);

      let cgstRate = 0;
      let cgstAmt = 0;
      let sgstRate = 0;
      let sgstAmt = 0;
      let utgstRate = 0;
      let utgstAmt = 0;
      let igstRate = 0;
      let igstAmt = 0;
      let adValoremCess = 0;

      if (!isZeroRated && adjustedTaxableValue > 0) {
        const lineTax = round2((adjustedTaxableValue * gstRate) / 100);

        if (isInterstate) {
          igstRate = gstRate;
          igstAmt = lineTax;
          totalIgst += igstAmt;
        } else if (isUtgst) {
          cgstRate = round2(gstRate / 2);
          utgstRate = round2(gstRate / 2);
          cgstAmt = round2(lineTax / 2);
          utgstAmt = round2(lineTax - cgstAmt);
          totalCgst += cgstAmt;
          totalUtgst += utgstAmt;
        } else {
          cgstRate = round2(gstRate / 2);
          sgstRate = round2(gstRate / 2);
          cgstAmt = round2(lineTax / 2);
          sgstAmt = round2(lineTax - cgstAmt);
          totalCgst += cgstAmt;
          totalSgst += sgstAmt;
        }

        if (cessRate > 0) {
          adValoremCess = round2((adjustedTaxableValue * cessRate) / 100);
        }
      }

      const lineTotalCess = round2(adValoremCess + specificCess);
      totalCess += lineTotalCess;

      const totalLineTax = round2(cgstAmt + sgstAmt + utgstAmt + igstAmt + lineTotalCess);
      const totalAmount = round2(adjustedTaxableValue + totalLineTax);

      return {
        ...item,
        taxable_value: adjustedTaxableValue,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmt,
        sgst_rate: isUtgst ? utgstRate : sgstRate,
        sgst_amount: isUtgst ? utgstAmt : sgstAmt,
        igst_rate: igstRate,
        igst_amount: igstAmt,
        cess_rate: cessRate,
        cess_amount: lineTotalCess,
        total_tax: totalLineTax,
        total_amount: totalAmount,
      };
    });

    totalCgst = round2(totalCgst);
    totalSgst = round2(totalSgst);
    totalUtgst = round2(totalUtgst);
    totalIgst = round2(totalIgst);
    totalCess = round2(totalCess);

    // Process Additional Charges
    let chargesTotal = 0;
    let chargesTax = 0;
    additionalCharges.forEach((charge) => {
      const chgAmt = round2(Number(charge.amount) || 0);
      chargesTotal += chgAmt;

      if (charge.is_taxable && Number(charge.gst_rate) > 0) {
        const cTax = round2((chgAmt * Number(charge.gst_rate)) / 100);
        chargesTax += cTax;

        if (isInterstate) {
          totalIgst = round2(totalIgst + cTax);
        } else if (isUtgst) {
          const half = round2(cTax / 2);
          totalCgst = round2(totalCgst + half);
          totalUtgst = round2(totalUtgst + (cTax - half));
        } else {
          const half = round2(cTax / 2);
          totalCgst = round2(totalCgst + half);
          totalSgst = round2(totalSgst + (cTax - half));
        }
      }
    });

    const netTaxableAmount = round2(unadjustedTaxableTotal - invoiceDiscountAmount);
    const totalTaxAmount = round2(totalCgst + totalSgst + totalUtgst + totalIgst + totalCess);

    // In reverse charge, statutory tax is paid directly by recipient to govt; not collected on invoice
    const rawGrandTotal = round2(
      netTaxableAmount + (reverseCharge ? 0 : totalTaxAmount) + chargesTotal
    );

    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = round2(roundedGrandTotal - rawGrandTotal);

    return {
      subtotal: grossSubtotal,
      totalItemDiscount,
      invoiceDiscountAmount,
      taxableAmount: netTaxableAmount,
      totalCgst,
      totalSgst,
      totalUtgst,
      totalIgst,
      totalCess,
      totalTaxAmount,
      chargesTotal: round2(chargesTotal),
      chargesTax: round2(chargesTax),
      roundOff,
      grandTotal: roundedGrandTotal,
      isInterstate,
      isUtgst,
      calculatedItems,
    };
  }, [
    params.items,
    params.businessStateCode,
    params.placeOfSupplyStateCode,
    params.supplyType,
    params.reverseCharge,
    params.invoiceDiscountType,
    params.invoiceDiscountValue,
    params.additionalCharges,
  ]);
}

