import { BadRequestException, Injectable } from '@nestjs/common';

export interface AntiStackingContext {
  existingCouponCode?: string | null;
  hasTierDiscount?: boolean;
  hasBundleItem?: boolean;
}

@Injectable()
export class AntiStackingValidator {
  /**
   * Validate anti-stacking business rules for promotional coupons.
   */
  validate(
    coupon: {
      code: string;
      allowStacking: boolean;
      discountType: string;
    },
    context: AntiStackingContext,
  ): { allowed: boolean; reason?: string; reasonBn?: string } {
    // Rule 1: Multi-coupon stacking prohibition
    if (context.existingCouponCode && context.existingCouponCode.toUpperCase() !== coupon.code.toUpperCase()) {
      return {
        allowed: false,
        reason: `Only one coupon code can be applied per checkout session (Active: ${context.existingCouponCode}).`,
        reasonBn: `প্রতিটি অর্ডারে কেবল একটি কুপন কোড ব্যবহার করা যাবে (সক্রিয়: ${context.existingCouponCode})।`,
      };
    }

    // Rule 2: Non-stackable coupon cannot combine with Loyalty VIP Tier discounts
    if (!coupon.allowStacking && context.hasTierDiscount) {
      return {
        allowed: false,
        reason: `Coupon "${coupon.code}" cannot be stacked with active VIP Loyalty Tier discounts.`,
        reasonBn: `কুপন "${coupon.code}" ভিআইপি লয়্যালটি ডিসকাউন্টের সাথে একসাথে ব্যবহার করা যাবে না।`,
      };
    }

    return { allowed: true };
  }

  assertAllowed(
    coupon: {
      code: string;
      allowStacking: boolean;
      discountType: string;
    },
    context: AntiStackingContext,
  ): void {
    const res = this.validate(coupon, context);
    if (!res.allowed) {
      throw new BadRequestException(res.reason);
    }
  }
}
