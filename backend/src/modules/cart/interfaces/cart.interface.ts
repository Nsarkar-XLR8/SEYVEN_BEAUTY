export interface CartItem {
  id: string; // Line item unique identifier or variantId
  productId: string;
  variantId: string;
  title: string;
  titleBn?: string;
  variantName: string;
  sku: string;
  unitPrice: number; // in BDT (discounted/active price)
  regularPrice: number; // in BDT (MRP/Original compare-at price)
  quantity: number;
  lineSubtotal: number; // unitPrice * quantity
  lineRegularTotal: number; // regularPrice * quantity
  lineSavings: number; // lineRegularTotal - lineSubtotal
  imageUrl?: string;
  weightGrams?: number;
  routineStep?: string;
  inStock: boolean;
  availableStock?: number;
  addedAt: string;
}

export interface FreeDeliveryProgress {
  threshold: number; // 2000 BDT
  isEligible: boolean;
  amountNeeded: number;
  progressPercentage: number;
}

export interface CartSummary {
  subtotal: number;
  totalRegularPrice: number;
  totalSavings: number;
  estimatedVat: number; // 0 or calculated inclusive/exclusive
  totalPayable: number;
  currency: string;
  totalItems: number;
  uniqueCount: number;
  freeDelivery: FreeDeliveryProgress;
}

export interface CartResponse {
  cartId: string;
  userId?: string | null;
  guestToken?: string | null;
  items: CartItem[];
  summary: CartSummary;
  expiresInSeconds: number;
  updatedAt: string;
}
