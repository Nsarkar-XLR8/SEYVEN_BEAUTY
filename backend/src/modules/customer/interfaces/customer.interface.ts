import { OrderStatus, UserRole } from '@prisma/client';

export interface QuickTrackMilestone {
  step: string;
  label: string;
  labelBn: string;
  isCompleted: boolean;
  isCurrent: boolean;
  timestamp?: string | null;
}

export interface QuickTrackResult {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  statusLabelBn: string;
  courierName?: string | null;
  courierBookingId?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryWindow: string;
  shippingAddressMasked: {
    fullName: string;
    division: string;
    district: string;
    thanaArea: string;
    streetAddressMasked: string;
  };
  itemCount: number;
  subtotalBdt?: number;
  deliveryFeeBdt?: number;
  discountBdt?: number;
  totalPayableBdt: number;
  advancePaidBdt: number;
  codDueBdt: number;
  paymentStatus: string;
  paymentGateway: string;
  milestones: QuickTrackMilestone[];
  items?: Array<{
    title: string;
    variant?: string;
    quantity: number;
    unitPriceBdt: number;
    lineTotalBdt: number;
  }>;
  createdAt: string;
}

export interface CustomerProfileSummary {
  user: {
    id: string;
    phone: string;
    email?: string | null;
    fullName?: string | null;
    role: UserRole;
    isPhoneVerified: boolean;
    createdAt: string;
  };
  savedAddresses: any[];
  loyalty: {
    isRepeatClient?: boolean;
    privilegeDiscountPercent?: number;
    pointsBalance?: number;
    lifetimePoints?: number;
    tier?: string;
  };
  ordersSummary: {
    totalOrdersCount: number;
    activeOrdersCount: number;
    deliveredOrdersCount: number;
    recentOrders: any[];
  };
  activeRmaTickets: any[];
}

export interface Customer360Dossier {
  overview: {
    id: string;
    phone: string;
    email?: string | null;
    fullName?: string | null;
    role: UserRole;
    isPhoneVerified: boolean;
    isBlacklisted: boolean;
    fraudRiskScore: number;
    customerSince: string;
  };
  financialMetrics: {
    lifetimeValueBdt: number; // LTV
    averageOrderValueBdt: number; // AOV
    totalOrdersCount: number;
    deliveredOrdersCount: number;
    cancelledOrdersCount: number;
    returnedOrdersCount: number;
    deliverySuccessRatePercent: number;
    rtoLossTotalBdt: number;
  };
  loyaltyStatus: {
    isRepeatClient?: boolean;
    privilegeDiscountPercent?: number;
    pointsBalance?: number;
    lifetimePoints?: number;
    tier?: string;
  };
  interactionTimeline: {
    orders: any[];
    smsLogs: any[];
    callVerifications: any[];
    rmaRequests: any[];
  };
}

export interface GdprExportArchive {
  generatedAt: string;
  exportFormatVersion: string;
  legalEntity: string;
  dataSubject: {
    id: string;
    phone: string;
    email?: string | null;
    fullName?: string | null;
    createdAt: string;
  };
  savedAddresses: any[];
  orders: any[];
  notificationsSent: any[];
  rmaRequests: any[];
}
