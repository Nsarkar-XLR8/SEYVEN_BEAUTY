import { AntiStackingValidator } from './anti-stacking.validator';
import { BadRequestException } from '@nestjs/common';

describe('AntiStackingValidator', () => {
  let validator: AntiStackingValidator;

  beforeEach(() => {
    validator = new AntiStackingValidator();
  });

  it('should allow valid single coupon without tier discount', () => {
    const coupon = { code: 'WELCOME10', allowStacking: false, discountType: 'PERCENTAGE' };
    const context = { hasTierDiscount: false };

    const res = validator.validate(coupon, context);
    expect(res.allowed).toBe(true);
  });

  it('should reject when non-stackable coupon is applied alongside VIP tier discount', () => {
    const coupon = { code: 'WELCOME10', allowStacking: false, discountType: 'PERCENTAGE' };
    const context = { hasTierDiscount: true };

    const res = validator.validate(coupon, context);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('cannot be stacked with active VIP Loyalty Tier discounts');

    expect(() => validator.assertAllowed(coupon, context)).toThrow(BadRequestException);
  });

  it('should allow stackable coupon (e.g. Free Shipping) alongside VIP tier discount', () => {
    const coupon = { code: 'FREESHIP', allowStacking: true, discountType: 'FREE_SHIPPING' };
    const context = { hasTierDiscount: true };

    const res = validator.validate(coupon, context);
    expect(res.allowed).toBe(true);
  });

  it('should reject when another coupon is already active on checkout', () => {
    const coupon = { code: 'GLOW2026', allowStacking: false, discountType: 'PERCENTAGE' };
    const context = { existingCouponCode: 'WELCOME10' };

    const res = validator.validate(coupon, context);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Only one coupon code can be applied');
  });
});
