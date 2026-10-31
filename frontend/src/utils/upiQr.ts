import QRCode from "qrcode";

export interface DynamicUpiParams {
  payeeVpa: string;        // e.g. "quantumgst@okhdfcbank"
  payeeName: string;       // e.g. "QuantumGST Solutions"
  amount: number;          // e.g. 3255.00
  transactionNote?: string;// e.g. "INV-QGST-0042"
  transactionRef?: string; // e.g. "INV0042"
}

/**
 * Builds standard NPCI UPI Intent URI format
 * upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function buildUpiUri(params: DynamicUpiParams): string {
  const { payeeVpa, payeeName, amount, transactionNote, transactionRef } = params;
  const vpa = encodeURIComponent(payeeVpa.trim());
  const name = encodeURIComponent(payeeName.trim());
  const amt = amount > 0 ? amount.toFixed(2) : "0.00";
  const note = encodeURIComponent(transactionNote || "Invoice Settlement");

  let uri = `upi://pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;
  if (transactionRef) {
    uri += `&tr=${encodeURIComponent(transactionRef)}`;
  }
  return uri;
}

/**
 * Generates Base64 Data URL for QR Code image
 */
export async function generateUpiQrDataUrl(params: DynamicUpiParams): Promise<string> {
  const upiUri = buildUpiUri(params);
  try {
    return await QRCode.toDataURL(upiUri, {
      width: 256,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    });
  } catch (err) {
    console.error("Failed to generate UPI QR Code", err);
    return "";
  }
}
