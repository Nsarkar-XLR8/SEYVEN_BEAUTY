export type AttributionModelType = 'first_touch' | 'last_touch' | 'linear';

export interface UtmParameters {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  timestamp?: string;
}

export interface IngestAnalyticsEventResult {
  success: boolean;
  eventId: string;
  eventName: string;
  isDuplicate: boolean;
  metaDispatched: boolean;
  ga4Dispatched: boolean;
  message?: string;
}

export interface ChannelAttributionMetric {
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  ordersCount: number;
  totalRevenueBdt: number;
  averageOrderValueBdt: number;
  shareOfRevenuePercent: number;
  firstTouchAttributedOrders: number;
  lastTouchAttributedOrders: number;
  estimatedAdSpendBdt: number;
  estimatedRoas: number; // Return on Ad Spend: Revenue / AdSpend
}

export interface AttributionReportResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  model: AttributionModelType;
  summary: {
    totalOrders: number;
    totalRevenueBdt: number;
    averageOrderValueBdt: number;
    totalAdSpendBdt: number;
    blendedRoas: number;
    topAcquisitionChannel: string;
  };
  channels: ChannelAttributionMetric[];
  funnel: {
    pageViews: number;
    viewContent: number;
    addToCart: number;
    initiateCheckout: number;
    purchase: number;
    cartToCheckoutRate: number;
    checkoutToPurchaseRate: number;
  };
}
