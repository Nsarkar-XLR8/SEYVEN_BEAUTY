export interface GeoThana {
  nameEn: string;
  nameBn: string;
  courierZoneId: number; // 1: Inside Dhaka, 2: Dhaka Suburbs, 3: Outside Dhaka Major, 4: Remote Upazila
  postCode?: string;
}

export interface GeoDistrict {
  nameEn: string;
  nameBn: string;
  divisionEn: string;
  thanas: GeoThana[];
}

export interface GeoDivision {
  nameEn: string;
  nameBn: string;
  districts: string[];
}

export interface CheckoutCalculationResult {
  subtotal: number;
  regularTotal: number;
  savings: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  festivalDiscount?: number;
  festivalCampaign?: {
    nameEn: string;
    nameBn: string;
    discountPercent: number;
    discountBdt: number;
  } | null;
  clientPrivilegeDiscount?: number;
  isReturningClient?: boolean;
  couponDiscount: number;
  appliedCouponCode?: string | null;
  totalVat: number;
  totalPayable: number;
  advancePaymentRequired: number;
  codDue: number;
  estimatedDeliveryWindow: string;
  estimatedDeliveryWindowBn: string;
  totalWeightGrams: number;
  currency: string;
}

export interface CheckoutCommitResult {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentGateway: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalPayable: number;
  advancePaid: number;
  codDue: number;
  shippingAddress: any;
  itemsCount: number;
  metaEventId?: string;
  idempotentReplay?: boolean;
  createdAt: string;
}
