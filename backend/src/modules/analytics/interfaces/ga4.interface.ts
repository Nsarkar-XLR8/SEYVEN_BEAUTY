export interface Ga4Item {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

export interface Ga4Event {
  name: string;
  params: {
    currency?: string;
    value?: number;
    transaction_id?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items?: Ga4Item[];
    payment_type?: string;
    shipping_tier?: string;
    search_term?: string;
    engagement_time_msec?: number;
    session_id?: string;
    [key: string]: unknown;
  };
}

export interface Ga4Payload {
  client_id: string;
  user_id?: string;
  timestamp_micros?: number;
  non_personalized_ads?: boolean;
  events: Ga4Event[];
}

export interface Ga4DispatchResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
}
