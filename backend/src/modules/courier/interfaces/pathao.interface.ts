export interface PathaoTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PathaoCreateOrderPayload {
  store_id: number;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: number;
  recipient_zone: number;
  recipient_area?: number;
  delivery_type: number; // 48: Normal delivery (48 hours)
  item_type: number; // 1: Document, 2: Parcel
  special_instruction?: string;
  item_quantity: number;
  item_weight: number; // in KG
  amount_to_collect: number; // strictly passing order.codDueBdt
  item_description: string;
}

export interface PathaoCreateOrderResponse {
  type: string;
  message: string;
  data: {
    consignment_id: string;
    merchant_order_id: string;
    order_status: string;
    delivery_fee: number;
  };
}

export interface PathaoTrackingResponse {
  type: string;
  message: string;
  data: {
    consignment_id: string;
    merchant_order_id: string;
    order_status: string;
    order_status_slug: string;
    updated_at: string;
  };
}

export interface PathaoWebhookPayload {
  consignment_id: string;
  merchant_order_id: string;
  order_status: string;
  order_status_slug?: string;
  collected_amount?: number;
  reason?: string;
  updated_at?: string;
}

export interface PathaoDlqEntry {
  jobId: string;
  orderId: string;
  orderNumber: string;
  error: string;
  attemptCount: number;
  failedAt: string;
  payload: PathaoCreateOrderPayload;
}
