import { Injectable } from '@nestjs/common';
import {
  TierPerks,
  TierStatusResponse,
  TierThresholdInfo,
  VipTier,
} from '../interfaces/loyalty.interface';

@Injectable()
export class TierCalculatorService {
  private static readonly TIER_CONFIG: {
    tier: VipTier;
    tierNameBn: string;
    minLifetimePoints: number;
    multiplier: number;
    freeShippingThresholdBdt: number | null;
    priorityDispatch: boolean;
    birthdayBonusPoints: number;
    description: string;
    descriptionBn: string;
  }[] = [
    {
      tier: 'BRONZE',
      tierNameBn: 'ব্রোঞ্জ ভিআইপি',
      minLifetimePoints: 0,
      multiplier: 1.0,
      freeShippingThresholdBdt: 1500,
      priorityDispatch: false,
      birthdayBonusPoints: 50,
      description: 'Standard 1x earn rate (1 point per 10 BDT). Free shipping over 1,500 BDT.',
      descriptionBn: 'প্রতি ১০ টাকায় ১ পয়েন্ট। ১৫০০ টাকার অর্ডারে ফ্রি ডেলিভারি।',
    },
    {
      tier: 'SILVER',
      tierNameBn: 'সিলভার ভিআইপি',
      minLifetimePoints: 1000,
      multiplier: 1.25,
      freeShippingThresholdBdt: 1000,
      priorityDispatch: true,
      birthdayBonusPoints: 100,
      description: '1.25x earn multiplier. Free delivery over 1,000 BDT with priority warehouse dispatch.',
      descriptionBn: '১.২৫ গুণ পয়েন্ট। ১০০০ টাকার অর্ডারে ফ্রি ডেলিভারি ও দ্রুত প্যাকিং সুবিধা।',
    },
    {
      tier: 'GOLD',
      tierNameBn: 'গোল্ড ভিআইপি',
      minLifetimePoints: 5000,
      multiplier: 1.5,
      freeShippingThresholdBdt: 500,
      priorityDispatch: true,
      birthdayBonusPoints: 150,
      description: '1.5x earn multiplier. Free delivery over 500 BDT, dedicated dermal advisor access.',
      descriptionBn: '১.৫ গুণ পয়েন্ট। ৫০০ টাকার অর্ডারে ফ্রি ডেলিভারি ও স্কিনকেয়ার বিশেষজ্ঞ পরামর্শ।',
    },
    {
      tier: 'NOIR',
      tierNameBn: 'নোয়ার ব্ল্যাক মেম্বার',
      minLifetimePoints: 15000,
      multiplier: 2.0,
      freeShippingThresholdBdt: null, // Unconditional free shipping on every single order
      priorityDispatch: true,
      birthdayBonusPoints: 300,
      description: 'Elite 2x earn multiplier. Unconditional free shipping on all orders and concierge VIP support.',
      descriptionBn: 'সর্বোচ্চ ২ গুণ পয়েন্ট। যেকোনো অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি ও প্রাইভেট ভিআইপি সাপোর্ট।',
    },
  ];

  /**
   * Evaluates VIP tier based on accumulated lifetime points.
   */
  calculateTier(lifetimePoints: number): VipTier {
    if (lifetimePoints >= 15000) return 'NOIR';
    if (lifetimePoints >= 5000) return 'GOLD';
    if (lifetimePoints >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Retrieves tier privileges and rate multipliers.
   */
  getTierPerks(tier: VipTier): TierPerks {
    const config =
      TierCalculatorService.TIER_CONFIG.find((c) => c.tier === tier) ||
      TierCalculatorService.TIER_CONFIG[0];

    return {
      tier: config.tier,
      tierNameBn: config.tierNameBn,
      pointsMultiplier: config.multiplier,
      description: config.description,
      redemptionRateBdtPerPoint: 0.1, // 10 points = 1 BDT
      freeShippingMinimumSpendBdt: config.freeShippingThresholdBdt,
      priorityDispatch: config.priorityDispatch,
      birthdayBonusPoints: config.birthdayBonusPoints,
    };
  }

  /**
   * Computes progression towards the next VIP tier.
   */
  calculateNextTierProgress(lifetimePoints: number): TierStatusResponse {
    const currentTier = this.calculateTier(lifetimePoints);
    const configs = TierCalculatorService.TIER_CONFIG;
    const currentIndex = configs.findIndex((c) => c.tier === currentTier);

    let nextTier: VipTier | null = null;
    let pointsNeededForNextTier = 0;
    let progressPercent = 100;

    if (currentIndex < configs.length - 1) {
      const nextConfig = configs[currentIndex + 1];
      const currentConfig = configs[currentIndex];
      nextTier = nextConfig.tier;
      pointsNeededForNextTier = Math.max(0, nextConfig.minLifetimePoints - lifetimePoints);

      const tierSpan = nextConfig.minLifetimePoints - currentConfig.minLifetimePoints;
      const pointsInCurrentTier = lifetimePoints - currentConfig.minLifetimePoints;
      progressPercent = Math.min(
        100,
        Math.max(0, Math.round((pointsInCurrentTier / tierSpan) * 100)),
      );
    }

    const tiersProgression: TierThresholdInfo[] = configs.map((c, idx) => ({
      tier: c.tier,
      tierNameBn: c.tierNameBn,
      minLifetimePoints: c.minLifetimePoints,
      pointsMultiplier: c.multiplier,
      perksSummary: c.description,
      isUnlocked: lifetimePoints >= c.minLifetimePoints,
      isCurrent: c.tier === currentTier,
    }));

    return {
      currentTier,
      lifetimePoints,
      nextTier,
      pointsNeededForNextTier,
      progressPercent,
      tiersProgression,
    };
  }

  /**
   * Computes points earned for a delivered order based on final net spend and tier multiplier.
   * Formula: Floor((orderAmountBdt / 10) * multiplier)
   */
  calculatePointsEarned(orderAmountBdt: number, tier: VipTier): number {
    if (orderAmountBdt <= 0) return 0;
    const perks = this.getTierPerks(tier);
    const basePoints = orderAmountBdt / 10;
    return Math.floor(basePoints * perks.pointsMultiplier);
  }

  /**
   * Converts loyalty points to purchasing discount value in BDT.
   * 10 points = 1 BDT (0.1 BDT per point).
   */
  calculateMonetaryValueBdt(points: number): number {
    return Math.floor((points / 10) * 100) / 100;
  }
}
