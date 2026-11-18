export interface SteadfastCreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
}

export interface SteadfastConsignmentData {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface SteadfastCreateOrderResponse {
  status: number;
  message: string;
  consignment: SteadfastConsignmentData;
}

export interface SteadfastTrackingData {
  consignment_id: number | string;
  invoice: string;
  tracking_code: string;
  status: string;
  delivery_status?: string;
  updated_at?: string;
}

export interface SteadfastTrackingResponse {
  status: number;
  delivery_status: string;
  consignment: SteadfastTrackingData;
}

export interface SteadfastWebhookPayload {
  notification_type?: string;
  consignment_id: number | string;
  invoice?: string;
  status: string;
  tracking_code?: string;
  collected_amount?: number;
  reason?: string;
  updated_at?: string;
}

export interface SteadfastDlqEntry {
  jobId: string;
  orderId: string;
  orderNumber: string;
  error: string;
  attemptCount: number;
  failedAt: string;
  payload: SteadfastCreateOrderPayload;
}

export interface SteadfastBalanceResponse {
  status: number;
  current_balance: number;
}

export interface SteadfastFraudScoreResponse {
  status: number;
  phone: string;
  delivery_ratio?: number;
  cancellation_ratio?: number;
  volume_band?: string;
  volume_range?: string;
  delivered_count?: number;
  cancelled_count?: number;
  total_reports?: number;
  fraud_categories?: string[];
  score?: number | null;
  level?: string | null;
  reasons?: string[];
  scoring_disabled?: boolean;
  doubtful_reports?: boolean;
}

export interface SteadfastPickupPayload {
  address_id?: number;
  police_station_id?: number;
  address: string;
  contact_number: string;
  note?: string;
  estim_qty?: number;
}

export interface SteadfastPickupResponse {
  message: string;
  data?: {
    id: number;
    user_id?: number;
    user_address_id?: number;
    police_station_id?: number;
    pickup_location?: string;
    contact_number?: string;
    note?: string | null;
    estim_qty?: number;
    req_status?: number;
    created_at?: string;
  };
}

export interface SteadfastPaymentItem {
  payment_id: string;
  amount: number;
  method: string;
  due_bills?: number;
  paid_bills?: number;
  charges?: number;
  total?: number;
  status_label?: string;
  created_at?: string;
  paid_at?: string;
}

export interface SteadfastPaymentsResponse {
  status: number;
  alertClass?: string;
  message?: string;
  payments: SteadfastPaymentItem[];
}

