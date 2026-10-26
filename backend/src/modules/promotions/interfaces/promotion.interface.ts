export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export interface CouponValidationResult {
  isValid: boolean;
  code: string;
  titleEn: string;
  titleBn: string;
  discountType: DiscountType;
  discountValue: number;
  calculatedDiscount: number;
  freeShipping: boolean;
  gwpItem?: {
    productId: string;
    variantId: string;
    title: string;
    titleBn: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  };
  message: string;
  messageBn: string;
}

export interface ActivePromotionItem {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  descriptionEn?: string;
  descriptionBn?: string;
  bannerUrl?: string;
  promotionType: 'TIER_DISCOUNT' | 'GWP_GIFT' | 'FLASH_SALE' | 'FREE_SHIPPING_PROMO' | 'FESTIVAL_CAMPAIGN';
  minSpendBdt: number;
  rewardPayload: any;
  startsAt: string;
  expiresAt?: string | null;
}
