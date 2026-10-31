export interface HsnMasterEntry {
  hsn: string;
  description: string;
  category: "Goods" | "Services";
  gstRate: number; // 0, 0.1, 0.25, 3, 5, 12, 18, 28
  cessRate?: number;
}

export const COMMON_HSN_MASTER: HsnMasterEntry[] = [
  // Apparel & Textiles (5% / 12%)
  { hsn: "5007", description: "Woven fabrics of silk or of silk waste", category: "Goods", gstRate: 5 },
  { hsn: "5208", description: "Woven fabrics of cotton (containing >= 85% cotton)", category: "Goods", gstRate: 5 },
  { hsn: "6109", description: "T-shirts, singlets and other vests, knitted or crocheted", category: "Goods", gstRate: 5 },
  { hsn: "6203", description: "Men's or boys' suits, jackets, blazers, trousers", category: "Goods", gstRate: 5 },
  { hsn: "6204", description: "Women's or girls' suits, dresses, skirts, trousers", category: "Goods", gstRate: 5 },
  { hsn: "6205", description: "Men's or boys' shirts (Cotton / Synthetic)", category: "Goods", gstRate: 5 },
  { hsn: "6211", description: "Track suits, ski suits and swimwear, other garments", category: "Goods", gstRate: 12 },

  // Electronics & IT Hardware (18%)
  { hsn: "8443", description: "Printers, POS thermal receipt printers, facsimile machines", category: "Goods", gstRate: 18 },
  { hsn: "8471", description: "Automatic data processing machines, computers, barcode scanners", category: "Goods", gstRate: 18 },
  { hsn: "8517", description: "Smartphones, cellular telephones, transmission apparatus", category: "Goods", gstRate: 18 },
  { hsn: "8528", description: "Monitors, projectors, and television reception apparatus", category: "Goods", gstRate: 18 },
  { hsn: "8504", description: "Electrical transformers, static converters, UPS and power adapters", category: "Goods", gstRate: 18 },

  // Food, FMCG & Essentials (0%, 5%, 12%, 18%)
  { hsn: "0401", description: "Fresh milk, pasteurized milk (unbranded)", category: "Goods", gstRate: 0 },
  { hsn: "0402", description: "Milk and cream, concentrated or containing added sugar", category: "Goods", gstRate: 5 },
  { hsn: "0901", description: "Coffee, whether or not roasted or decaffeinated", category: "Goods", gstRate: 5 },
  { hsn: "0902", description: "Tea, whether or not flavored", category: "Goods", gstRate: 5 },
  { hsn: "1905", description: "Bread, pastry, cakes, biscuits, wafers, rusks", category: "Goods", gstRate: 18 },
  { hsn: "2106", description: "Food preparations not elsewhere specified, protein powders", category: "Goods", gstRate: 18 },
  { hsn: "2201", description: "Waters, including natural or artificial mineral waters", category: "Goods", gstRate: 18 },
  { hsn: "2202", description: "Aerated waters, soft drinks, containing added sugar (Cess 12%)", category: "Goods", gstRate: 28, cessRate: 12 },

  // Services (SAC Codes - 18%)
  { hsn: "998311", description: "Information technology (IT) consulting and software support services", category: "Services", gstRate: 18 },
  { hsn: "998313", description: "Information technology (IT) infrastructure and cloud hosting services", category: "Services", gstRate: 18 },
  { hsn: "998221", description: "Financial auditing, statutory accounting, and bookkeeping services", category: "Services", gstRate: 18 },
  { hsn: "998231", description: "Legal advisory, documentation, and representation services", category: "Services", gstRate: 18 },
  { hsn: "996511", description: "Road transport services of goods by Goods Transport Agency (GTA)", category: "Services", gstRate: 5 },
  { hsn: "997212", description: "Commercial property renting and leasing services", category: "Services", gstRate: 18 }
];

/**
 * Validates HSN code length compliance based on 2026 GST regulations.
 * Rule:
 *  - Imports/Exports: 8 digits mandatory.
 *  - Turnover > ₹5 Cr: 6 digits mandatory.
 *  - Turnover <= ₹5 Cr: 4 digits mandatory on B2B; optional on B2C.
 */
export function validateHsnCompliance(
  hsn: string,
  isB2B: boolean,
  annualTurnoverExceeds5Cr: boolean = false,
  isExport: boolean = false
): { isValid: boolean; warning?: string } {
  const cleanHsn = (hsn || "").trim().replace(/\s+/g, "");

  if (!cleanHsn) {
    if (isB2B || isExport || annualTurnoverExceeds5Cr) {
      return { isValid: false, warning: "HSN/SAC code is mandatory for statutory compliance." };
    }
    return { isValid: true };
  }

  if (isExport && cleanHsn.length < 8) {
    return { isValid: false, warning: "Exports/SEZ require full 8-digit HSN/ITC-HS code." };
  }

  if (annualTurnoverExceeds5Cr && cleanHsn.length < 6) {
    return { isValid: false, warning: "Turnover > ₹5 Cr requires minimum 6-digit HSN code." };
  }

  if (isB2B && cleanHsn.length < 4) {
    return { isValid: false, warning: "B2B invoices require at least 4 digits for HSN/SAC." };
  }

  return { isValid: true };
}
