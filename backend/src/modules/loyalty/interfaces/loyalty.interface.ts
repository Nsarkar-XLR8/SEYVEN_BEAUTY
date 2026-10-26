export type VipTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'NOIR';

export type LoyaltyTransactionType =
  | 'EARNED_PURCHASE'
  | 'REDEEMED_CHECKOUT'
  | 'CLAWBACK_RETURN'
  | 'TIER_BONUS'
  | 'MANUAL_ADJUSTMENT';

export const LoyaltyTransactionType = {
  EARNED_PURCHASE: 'EARNED_PURCHASE' as const,
  REDEEMED_CHECKOUT: 'REDEEMED_CHECKOUT' as const,
  CLAWBACK_RETURN: 'CLAWBACK_RETURN' as const,
  TIER_BONUS: 'TIER_BONUS' as const,
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT' as const,
};

export interface TierPerks {
  tier: VipTier;
  tierNameBn: string;
  pointsMultiplier: number;
  description: string;
  redemptionRateBdtPerPoint: number; // e.g. 0.10 (10 points = 1 BDT)
  freeShippingMinimumSpendBdt: number | null;
  priorityDispatch: boolean;
  birthdayBonusPoints: number;
}

export interface LoyaltyTransactionItem {
  id: string;
  type: string;
  points: number;
  runningBalance: number;
  description: string;
  orderId?: string | null;
  createdAt: string;
}

export interface LoyaltyBalanceResponse {
  accountId: string;
  userId: string;
  pointsBalance: number;
  monetaryValueBdt: number; // Conversion to BDT purchasing power
  lifetimePoints: number;
  currentTier: VipTier;
  tierPerks: TierPerks;
  recentTransactions: LoyaltyTransactionItem[];
}

export interface TierThresholdInfo {
  tier: VipTier;
  tierNameBn: string;
  minLifetimePoints: number;
  pointsMultiplier: number;
  perksSummary: string;
  isUnlocked: boolean;
  isCurrent: boolean;
}

export interface TierStatusResponse {
  currentTier: VipTier;
  lifetimePoints: number;
  nextTier: VipTier | null;
  pointsNeededForNextTier: number;
  progressPercent: number;
  tiersProgression: TierThresholdInfo[];
}

export interface RedeemPointsResult {
  success: boolean;
  pointsRedeemed: number;
  discountAmountBdt: number;
  remainingPointsBalance: number;
  originalCartTotalBdt: number;
  adjustedCartTotalBdt: number;
}

export interface ReplenishmentPrediction {
  userId: string;
  customerName: string;
  customerPhone: string;
  orderId: string;
  orderNumber: string;
  deliveredAt: string;
  productId: string;
  productTitle: string;
  category: string;
  estimatedLifespanDays: number;
  estimatedDepletionDate: string;
  daysUntilDepletion: number;
  status: 'OVERDUE' | 'DUE_SOON' | 'ACTIVE';
  suggestedChannel: 'WHATSAPP' | 'SMS';
}
