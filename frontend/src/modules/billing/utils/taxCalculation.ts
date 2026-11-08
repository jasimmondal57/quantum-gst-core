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
  const gross = Math.round(qty * rate * 100) / 100;

  let itemDiscount = 0;
  const discVal = Number(item.discount_value) || 0;
  if (item.discount_type === "percentage") {
    itemDiscount = Math.round(((gross * discVal) / 100) * 100) / 100;
  } else {
    itemDiscount = Math.round(discVal * 100) / 100;
  }
  if (itemDiscount > gross) itemDiscount = gross;

  const grossLessDiscount = Math.round((gross - itemDiscount) * 100) / 100;
  const gstRate = Number(item.gst_rate) || 0;
  const cessRate = Number(item.cess_rate) || 0;
  const cessSpecificPerUnit = Number(item.cess_specific) || 0;
  const specificCessTotal = Math.round(qty * cessSpecificPerUnit * 100) / 100;

  let taxableValue = 0;
  let gstAmount = 0;
  let adValoremCess = 0;

  if (item.tax_inclusive && (gstRate > 0 || cessRate > 0 || specificCessTotal > 0)) {
    // Reverse tax extraction:
    // Deduct specific cess from gross before applying statutory ad-valorem formula
    const grossLessSpecific = Math.max(0, grossLessDiscount - specificCessTotal);
    const totalRate = gstRate + cessRate;
    taxableValue = Math.round(((grossLessSpecific * 100) / (100 + totalRate)) * 100) / 100;
    gstAmount = Math.round(((taxableValue * gstRate) / 100) * 100) / 100;
    adValoremCess = Math.round(((taxableValue * cessRate) / 100) * 100) / 100;
  } else {
    // Forward tax addition:
    taxableValue = grossLessDiscount;
    gstAmount = Math.round(((taxableValue * gstRate) / 100) * 100) / 100;
    adValoremCess = Math.round(((taxableValue * cessRate) / 100) * 100) / 100;
  }

  const cessAmount = Math.round((adValoremCess + specificCessTotal) * 100) / 100;
  const totalTax = Math.round((gstAmount + cessAmount) * 100) / 100;
  const rowTotal = item.tax_inclusive
    ? grossLessDiscount
    : Math.round((taxableValue + totalTax) * 100) / 100;

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

