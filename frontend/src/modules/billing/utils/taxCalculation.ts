export interface CalculatedItemRow {
  gross: number;
  itemDiscount: number;
  grossLessDiscount: number;
  taxableValue: number;
  gstAmount: number;
  cessAmount: number;
  totalTax: number;
  rowTotal: number;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Statutory GST and Cess calculation helper for single line items.
 * Handles both Tax-Exclusive (forward) and Tax-Inclusive (backward reverse-extraction) modes.
 */
export function calculateItemRowTaxes(item: {
  quantity: number;
  unit_price: number;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  gst_rate?: number;
  tax_inclusive?: boolean;
  cess_rate?: number;
  cess_specific?: number;
}): CalculatedItemRow {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.unit_price) || 0;
  const gross = round2(qty * rate);

  let itemDiscount = 0;
  const discVal = Number(item.discount_value) || 0;
  if (item.discount_type === "percentage") {
    itemDiscount = round2((gross * discVal) / 100);
  } else {
    itemDiscount = round2(discVal);
  }
  if (itemDiscount > gross) itemDiscount = gross;

  const grossLessDiscount = round2(gross - itemDiscount);
  const gstRate = Number(item.gst_rate) || 0;
  const cessRate = Number(item.cess_rate) || 0;
  const cessSpecificPerUnit = Number(item.cess_specific) || 0;
  const specificCessTotal = round2(qty * cessSpecificPerUnit);

  let taxableValue = 0;
  let gstAmount = 0;
  let adValoremCess = 0;

  if (item.tax_inclusive && (gstRate > 0 || cessRate > 0 || specificCessTotal > 0)) {
    // Reverse tax extraction:
    // Deduct specific cess from gross before applying statutory ad-valorem formula
    const grossLessSpecific = Math.max(0, grossLessDiscount - specificCessTotal);
    const totalRate = gstRate + cessRate;
    taxableValue = round2((grossLessSpecific * 100) / (100 + totalRate));
    gstAmount = round2((taxableValue * gstRate) / 100);
    adValoremCess = round2((taxableValue * cessRate) / 100);
  } else {
    // Forward tax addition:
    taxableValue = grossLessDiscount;
    gstAmount = round2((taxableValue * gstRate) / 100);
    adValoremCess = round2((taxableValue * cessRate) / 100);
  }

  const cessAmount = round2(adValoremCess + specificCessTotal);
  const totalTax = round2(gstAmount + cessAmount);
  const rowTotal = item.tax_inclusive
    ? grossLessDiscount
    : round2(taxableValue + totalTax);

  return {
    gross,
    itemDiscount,
    grossLessDiscount,
    taxableValue,
    gstAmount,
    cessAmount,
    totalTax,
    rowTotal,
  };
}
