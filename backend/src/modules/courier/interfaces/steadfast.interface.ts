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
