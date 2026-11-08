export interface Party {
  id?: string;
  business_id?: string;
  name: string;
  trade_name?: string;
  party_type: "customer" | "supplier" | "both";
  gstin?: string;
  pan?: string;
  registration_type: "regular" | "composition" | "unregistered" | "consumer" | "sez" | "overseas";
  email?: string;
  phone?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_state_code?: string;
  billing_pincode?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_state_code?: string;
  shipping_pincode?: string;
  credit_limit?: number;
  credit_period_days?: number;
  opening_balance?: number;
  current_balance?: number;
}
