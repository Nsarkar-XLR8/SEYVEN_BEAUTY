export interface MetaCapiUserData {
  em?: string[]; // SHA-256 hashed emails
  ph?: string[]; // SHA-256 hashed phone numbers
  fn?: string[]; // SHA-256 hashed first names
  ln?: string[]; // SHA-256 hashed last names
  ct?: string[]; // SHA-256 hashed cities
  st?: string[]; // SHA-256 hashed states/divisions
  zp?: string[]; // SHA-256 hashed zip/postal codes
  country?: string[]; // SHA-256 hashed 2-letter country codes
  external_id?: string[]; // SHA-256 hashed user IDs
  client_ip_address?: string; // Unhashed client IP
  client_user_agent?: string; // Unhashed client User-Agent
  fbp?: string; // Facebook _fbp cookie
  fbc?: string; // Facebook _fbc click ID cookie
}

export interface MetaCapiContentItem {
  id: string;
  quantity: number;
  item_price?: number;
  title?: string;
  brand?: string;
  category?: string;
}

export interface MetaCapiCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: MetaCapiContentItem[];
  content_type?: 'product' | 'product_group';
  order_id?: string;
  predicted_ltv?: number;
  num_items?: number;
  status?: string;
  delivery_category?: string;
}

export interface MetaCapiEventPayload {
  event_name: string;
  event_time: number; // Unix timestamp in seconds
  event_id: string; // Deduplication ID shared with browser pixel
  event_source_url?: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  opt_out?: boolean;
  user_data: MetaCapiUserData;
  custom_data?: MetaCapiCustomData;
}

export interface MetaCapiBatchRequest {
  data: MetaCapiEventPayload[];
  test_event_code?: string;
}

export interface MetaCapiResponse {
  events_received: number;
  messages: string[];
  fbtrace_id: string;
}

export interface MetaCapiDlqEntry {
  jobId: string;
  eventId: string;
  eventName: string;
  attemptCount: number;
  failedAt: string;
  error: string;
  payload: MetaCapiEventPayload;
}
