import { useMemo } from "react";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { AdditionalCharge, SupplyType } from "../types/invoice";

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

    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalUtgst = 0;
    let totalIgst = 0;
    let totalCess = 0;

    const calculatedItems = items.map((item) => {
      const gross = round2(item.quantity * item.unit_price);
      let itemDiscount = 0;
      if (item.discount_type === "percentage") {
        itemDiscount = round2((gross * (item.discount_value || 0)) / 100);
      } else {
        itemDiscount = round2(item.discount_value || 0);
      }
      if (itemDiscount > gross) itemDiscount = gross;

      const taxableValue = round2(gross - itemDiscount);
      subtotal += gross;
      totalItemDiscount += itemDiscount;

      let cgstRate = 0;
      let cgstAmt = 0;
      let sgstRate = 0;
      let sgstAmt = 0;
      let utgstRate = 0;
      let utgstAmt = 0;
      let igstRate = 0;
      let igstAmt = 0;
      let cessAmt = 0;

      if (!isZeroRated && taxableValue > 0) {
        if (isInterstate) {
          igstRate = item.gst_rate;
          igstAmt = round2((taxableValue * igstRate) / 100);
          totalIgst += igstAmt;
        } else if (isUtgst) {
          cgstRate = round2(item.gst_rate / 2);
          utgstRate = round2(item.gst_rate / 2);
          cgstAmt = round2((taxableValue * cgstRate) / 100);
          utgstAmt = round2((taxableValue * utgstRate) / 100);
          totalCgst += cgstAmt;
          totalUtgst += utgstAmt;
        } else {
          cgstRate = round2(item.gst_rate / 2);
          sgstRate = round2(item.gst_rate / 2);
          cgstAmt = round2((taxableValue * cgstRate) / 100);
          sgstAmt = round2((taxableValue * sgstRate) / 100);
          totalCgst += cgstAmt;
          totalSgst += sgstAmt;
        }

        // Cess calculation
        if (item.cess_rate && item.cess_rate > 0) {
          cessAmt += round2((taxableValue * item.cess_rate) / 100);
        }
        if (item.cess_specific && item.cess_specific > 0) {
          cessAmt += round2(item.quantity * item.cess_specific);
        }
        totalCess += cessAmt;
      }

      const totalTax = round2(cgstAmt + sgstAmt + utgstAmt + igstAmt + cessAmt);
      const totalAmount = round2(taxableValue + totalTax);

      return {
        ...item,
        taxable_value: taxableValue,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmt,
        sgst_rate: isUtgst ? utgstRate : sgstRate,
        sgst_amount: isUtgst ? utgstAmt : sgstAmt,
        igst_rate: igstRate,
        igst_amount: igstAmt,
        cess_amount: cessAmt,
        total_tax: totalTax,
        total_amount: totalAmount,
      };
    });

    const itemsTaxableTotal = round2(subtotal - totalItemDiscount);

    // Invoice-level discount
    let invoiceDiscountAmount = 0;
    if (invoiceDiscountType === "percentage") {
      invoiceDiscountAmount = round2((itemsTaxableTotal * (invoiceDiscountValue || 0)) / 100);
    } else {
      invoiceDiscountAmount = round2(invoiceDiscountValue || 0);
    }
    if (invoiceDiscountAmount > itemsTaxableTotal) {
      invoiceDiscountAmount = itemsTaxableTotal;
    }

    // Additional charges & taxes
    let chargesTotal = 0;
    let chargesTax = 0;
    additionalCharges.forEach((charge) => {
      chargesTotal += round2(charge.amount || 0);
      if (charge.is_taxable && charge.gst_rate > 0) {
        const cTax = round2(((charge.amount || 0) * charge.gst_rate) / 100);
        chargesTax += cTax;
        if (isInterstate) {
          totalIgst += cTax;
        } else if (isUtgst) {
          totalCgst += round2(cTax / 2);
          totalUtgst += round2(cTax / 2);
        } else {
          totalCgst += round2(cTax / 2);
          totalSgst += round2(cTax / 2);
        }
      }
    });

    const netTaxableAmount = round2(itemsTaxableTotal - invoiceDiscountAmount);
    const totalTaxAmount = round2(totalCgst + totalSgst + totalUtgst + totalIgst + totalCess);

    const rawGrandTotal = round2(
      netTaxableAmount + (reverseCharge ? 0 : totalTaxAmount) + chargesTotal
    );

    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = round2(roundedGrandTotal - rawGrandTotal);

    return {
      subtotal: round2(subtotal),
      totalItemDiscount: round2(totalItemDiscount),
      invoiceDiscountAmount: round2(invoiceDiscountAmount),
      taxableAmount: netTaxableAmount,
      totalCgst: round2(totalCgst),
      totalSgst: round2(totalSgst),
      totalUtgst: round2(totalUtgst),
      totalIgst: round2(totalIgst),
      totalCess: round2(totalCess),
      totalTaxAmount: round2(totalTaxAmount),
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

