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
      const reason = `Only one coupon code can be applied per checkout session (Active: ${context.existingCouponCode}).`;
      return {
        allowed: false,
        reason,
        reasonBn: reason,
      };
    }

    // Rule 2: Non-stackable courtesy cannot combine with Returning Client Courtesy
    if (!coupon.allowStacking && context.hasTierDiscount) {
      const reason = `Campaign "${coupon.code}" cannot be stacked with active Returning Client Courtesy.`;
      return {
        allowed: false,
        reason,
        reasonBn: reason,
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
