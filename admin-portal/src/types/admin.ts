export type StaffRole =
  | 'SUPER_ADMIN'
  | 'FULFILLMENT_OPERATOR'
  | 'CATALOG_MANAGER'
  | 'FINANCE_OFFICER'
  | 'SUPPORT_AGENT';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  avatar: string;
  title: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type CODVerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'FLAGGED';

export interface OrderItem {
  id: string;
  sku: string;
  title: string;
  brand: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

export interface AdminOrder {
  id: string;
  referenceNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  zone: string;
  district: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  status: OrderStatus;
  codVerification: CODVerificationStatus;
  courier?: 'Pathao' | 'Steadfast';
  consignmentId?: string;
  courierTrackingUrl?: string;
  agentNotes?: string;
  source?: string;
  advancePaid?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRBatch {
  id: string;
  batchNumber: string;
  productName: string;
  sku: string;
  quantity: number;
  createdAt: string;
  downloadUrl?: string;
  scannedCount: number;
}

export interface ScanAnomaly {
  id: string;
  serialNumber: string;
  productTitle: string;
  firstScannedLocation: string;
  secondScannedLocation: string;
  firstScannedAt: string;
  secondScannedAt: string;
  timeDeltaMinutes: number;
  severity: 'CRITICAL' | 'WARNING';
  resolved: boolean;
  notes?: string;
}

export interface RedirectRule {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export interface TierConfig {
  id: string;
  name: string;
  thresholdBdt: number;
  discountPercent: number;
  descriptionEn: string;
}

export interface ClientSpendRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  deliveredOrdersCount: number;
  cumulativeSpendBdt: number;
  currentTier: string;
  discountPercent: number;
  lastMilestoneEmailAt: string | null;
}

export interface AdminCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  sortOrder: number;
  iconName: string;
  productCount: number;
  isActive: boolean;
}

export interface AdminProductVariant {
  id?: string;
  volume: string;
  priceBdt: number;
  sku?: string;
  inStock?: boolean;
  stockCount?: number;
  titleEn?: string;
  titleBn?: string;
}

export interface AdminProduct {
  id: string;
  slug?: string;
  titleEn: string;
  titleBn: string;
  brand: string;
  category: string;
  state: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  variantsCount: number;
  priceRangeBdt: string;
  priceBdt?: number;
  bstiApproved: boolean;
  imageUrl?: string;
  images?: string[];
  volume?: string;
  variants?: AdminProductVariant[];
  routineStep?: string;
  routinePeriod?: string;
  originCountry?: string;
  isPregnancySafe?: boolean;
  purposeTagEn?: string;
  purposeTagBn?: string;
  dermalStoryEn?: string;
  dermalStoryBn?: string;
  keyActives?: any;
  usageSteps?: any;
  fullInci?: any;
  storageGuidanceEn?: string;
  storageGuidanceBn?: string;
  skinTypes?: string[];
  shortDescriptionEn?: string;
  shortDescriptionBn?: string;
  createdAt: string;
}
