import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CartService } from '../cart/cart.service';
import {
  ApplyCouponDto,
  DetachCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto';
import { AntiStackingValidator } from './guards/anti-stacking.validator';
import {
  ActivePromotionItem,
  CouponValidationResult,
  DiscountType,
} from './interfaces/promotion.interface';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  // Fallback curated master promotion coupons
  private readonly MASTER_COUPONS: Record<
    string,
    {
      id: string;
      code: string;
      titleEn: string;
      titleBn: string;
      discountType: DiscountType;
      discountValue: number;
      maxDiscountBdt?: number;
      minOrderValueBdt: number;
      isFirstOrderOnly: boolean;
      allowStacking: boolean;
      gwpItem?: any;
    }
  > = {
    WELCOME10: {
      id: 'coupon-welc-10',
      code: 'WELCOME10',
      titleEn: '10% Welcome Discount for New Clients',
      titleBn: 'নতুন গ্রাহকদের জন্য ১০% স্বাগতম ছাড়',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxDiscountBdt: 500,
      minOrderValueBdt: 1000,
      isFirstOrderOnly: true,
      allowStacking: false,
    },
    DERMALVIP: {
      id: 'coupon-vip-500',
      code: 'DERMALVIP',
      titleEn: '৳500 Flat Savings on Dermal Regimens',
      titleBn: 'ডার্মাল রেজিম অর্ডারে সরাসরি ৫০০ টাকা ছাড়',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 500,
      minOrderValueBdt: 3000,
      isFirstOrderOnly: false,
      allowStacking: false,
    },
    FREESHIP: {
      id: 'coupon-free-ship',
      code: 'FREESHIP',
      titleEn: 'Nationwide Free Express Delivery',
      titleBn: 'দেশব্যাপী ফ্রি এক্সপ্রেস ডেলিভারি',
      discountType: DiscountType.FREE_SHIPPING,
      discountValue: 0,
      minOrderValueBdt: 1500,
      isFirstOrderOnly: false,
      allowStacking: true,
    },
    GLOW2026: {
      id: 'coupon-glow-2026',
      code: 'GLOW2026',
      titleEn: '15% Seasonal Radiance Promotion',
      titleBn: '১৫% সিজনাল রেডিয়েন্স স্পেশাল অফার',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      maxDiscountBdt: 750,
      minOrderValueBdt: 2500,
      isFirstOrderOnly: false,
      allowStacking: false,
    },
    GWPPREMIUM: {
      id: 'coupon-gwp-deluxe',
      code: 'GWPPREMIUM',
      titleEn: 'Complimentary 20ml Cica Barrier Serum Deluxe Sample',
      titleBn: 'ফ্রি ২০ মি.লি. সিকা ব্যারিয়ার সিরাম ডিলাক্স স্যাম্পল',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 5,
      minOrderValueBdt: 3500,
      isFirstOrderOnly: false,
      allowStacking: true,
      gwpItem: {
        productId: '11111111-1111-4111-a111-111111111102',
        variantId: '22222222-1111-4111-a111-111111111102',
        title: 'Complimentary Gift: 20ml Cica Barrier Serum Deluxe Mini',
        titleBn: 'উপহার: ২০ মি.লি. সিকা ব্যারিয়ার সিরাম ডিলাক্স মিনি',
        sku: 'GWP-CICA-20ML',
        quantity: 1,
        unitPrice: 0,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly cartService: CartService,
    private readonly antiStackingValidator: AntiStackingValidator,
  ) {}

  /**
   * Validate coupon eligibility and calculate projected discount.
   */
  async validateCoupon(
    dto: ValidateCouponDto,
    userId?: string,
  ): Promise<CouponValidationResult> {
    const code = dto.code.trim().toUpperCase();

    // 1. Fetch coupon definition from DB or fallback dictionary
    let coupon: any = null;
    try {
      coupon = await (this.prisma as any).coupon.findUnique({
        where: { code },
      });
    } catch {
      // Offline fallback
    }

    if (!coupon && this.MASTER_COUPONS[code]) {
      coupon = this.MASTER_COUPONS[code];
    }

    if (!coupon || coupon.isActive === false) {
      throw new NotFoundException(
        `Promotional coupon code "${code}" is invalid or expired.`,
      );
    }

    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      throw new BadRequestException(`Coupon "${code}" is not active yet.`);
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      throw new BadRequestException(`Coupon "${code}" has expired.`);
    }

    // 2. Minimum Order Value Check
    const minSpend = Number(coupon.minOrderValueBdt || 0);
    if (dto.subtotal < minSpend) {
      throw new BadRequestException(
        `Minimum order spend of ৳${minSpend.toLocaleString('en-US')} required to apply coupon "${code}". Current subtotal: ৳${dto.subtotal.toLocaleString('en-US')}.`,
      );
    }

    // 3. First-order only verification
    if (coupon.isFirstOrderOnly) {
      if (!userId) {
        // Guest user trying to use first-order coupon
      } else {
        try {
          const priorOrders = await (this.prisma as any).order.count({
            where: { userId, status: { notIn: ['CANCELLED', 'PAYMENT_FAILED'] } },
          });
          if (priorOrders > 0) {
            throw new BadRequestException(
              `Coupon "${code}" is valid for first-time customer orders only.`,
            );
          }
        } catch (dbErr) {
          if (dbErr instanceof BadRequestException) throw dbErr;
        }
      }
    }

    // 4. Anti-stacking validator
    this.antiStackingValidator.assertAllowed(
      {
        code: coupon.code,
        allowStacking: !!coupon.allowStacking,
        discountType: coupon.discountType,
      },
      {
        hasTierDiscount: dto.hasTierDiscount,
      },
    );

    // 5. Calculate discount amount
    let calculatedDiscount = 0;
    const discountType: DiscountType = coupon.discountType;
    const discountValue = Number(coupon.discountValue || 0);
    const maxDiscount = coupon.maxDiscountBdt ? Number(coupon.maxDiscountBdt) : null;

    if (discountType === DiscountType.PERCENTAGE) {
      const percentageDiscount = (dto.subtotal * discountValue) / 100;
      calculatedDiscount = maxDiscount
        ? Math.min(percentageDiscount, maxDiscount)
        : percentageDiscount;
    } else if (discountType === DiscountType.FIXED_AMOUNT) {
      calculatedDiscount = Math.min(dto.subtotal, discountValue);
    } else if (discountType === DiscountType.FREE_SHIPPING) {
      calculatedDiscount = 0;
    }

    calculatedDiscount = Math.round((calculatedDiscount + Number.EPSILON) * 100) / 100;

    return {
      isValid: true,
      code: coupon.code,
      titleEn: coupon.titleEn || `Promo Code ${coupon.code}`,
      titleBn: coupon.titleBn || `প্রোমো কোড ${coupon.code}`,
      discountType,
      discountValue,
      calculatedDiscount,
      freeShipping: discountType === DiscountType.FREE_SHIPPING,
      gwpItem: coupon.gwpItem,
      message: `Coupon "${code}" applied successfully! You saved ৳${calculatedDiscount}.`,
      messageBn: `কুপন "${code}" সফলভাবে যুক্ত হয়েছে! আপনি ৳${calculatedDiscount} সাশ্রয় করেছেন।`,
    };
  }

  /**
   * Attach coupon to active Redis shopping cart.
   */
  async applyCouponToCart(dto: ApplyCouponDto, userId?: string) {
    const cart = await this.cartService.getCart(userId, dto.guestToken);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cannot apply coupon to an empty shopping cart.');
    }

    const validation = await this.validateCoupon(
      {
        code: dto.code,
        subtotal: cart.summary.subtotal,
        guestToken: dto.guestToken,
      },
      userId,
    );

    const couponKey = userId ? `cart:coupon:user:${userId}` : `cart:coupon:guest:${dto.guestToken || cart.guestToken}`;
    await this.redisService.set(
      couponKey,
      JSON.stringify(validation),
      7 * 24 * 60 * 60,
    );

    // If GWP is provided, append complimentary sample to cart
    if (validation.gwpItem) {
      await this.cartService.addItem(
        {
          productId: validation.gwpItem.productId,
          variantId: validation.gwpItem.variantId,
          quantity: 1,
          routineStep: 'Complimentary Deluxe Gift',
          guestToken: dto.guestToken || cart.guestToken || undefined,
        },
        userId,
      );
    }

    // Return refreshed cart with applied coupon metadata
    const updatedCart = await this.cartService.getCart(userId, dto.guestToken);
    return {
      ...updatedCart,
      appliedCoupon: validation,
      summary: {
        ...updatedCart.summary,
        couponDiscount: validation.calculatedDiscount,
        totalPayable: Math.max(0, updatedCart.summary.subtotal - validation.calculatedDiscount),
      },
    };
  }

  /**
   * Detach coupon from active shopping cart.
   */
  async removeCouponFromCart(guestToken?: string, userId?: string) {
    const couponKey = userId ? `cart:coupon:user:${userId}` : `cart:coupon:guest:${guestToken}`;
    await this.redisService.set(couponKey, JSON.stringify(null), 60);

    const cart = await this.cartService.getCart(userId, guestToken);
    return {
      ...cart,
      appliedCoupon: null,
      message: 'Coupon removed from shopping cart.',
    };
  }

  /**
   * Fetch active promotions and storefront campaign banners.
   */
  async getActivePromotions(): Promise<ActivePromotionItem[]> {
    return [
      {
        id: 'promo-camp-01',
        slug: 'festive-courtesy-curations',
        titleEn: 'Seasonal Festival Courtesy: Automatic 7% Off All Curations',
        titleBn: 'উৎসব স্পেশাল কার্টেসী: সকল কিউরেশনে স্বয়ংক্রিয় ৭% ছাড়',
        descriptionEn: 'Zero coupon codes required. Applied automatically at checkout.',
        descriptionBn: 'কোনো কুপন কোডের প্রয়োজন নেই। চেকআউটে স্বয়ংক্রিয়ভাবে প্রযোজ্য।',
        bannerUrl: 'https://images.seyven.com/banners/festive-courtesy.webp',
        promotionType: 'FESTIVAL_CAMPAIGN',
        minSpendBdt: 1500,
        rewardPayload: { discountPercentage: 7 },
        startsAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    ];
  }

  // --- Seasonal Festival Campaigns Engine (Eid / Durga Puja / Festive Seasons) ---

  private festivalCampaigns = [
    {
      id: 'eid-festive-courtesy',
      nameEn: 'Eid-ul-Fitr Seasonal Courtesy Privilege',
      nameBn: 'ঈদুল ফিতর স্পেশাল কার্টেসী প্রিভিলেজ',
      seasonEn: 'Eid Festive Season',
      seasonBn: 'ঈদ উৎসব স্পেশাল',
      discountPercent: 7,
      minOrderValueBdt: 1500,
      isActive: true,
    },
    {
      id: 'puja-festive-courtesy',
      nameEn: 'Durga Puja Festive Curation Privilege',
      nameBn: 'শারদীয় দুর্গোৎসব স্পেশাল কিউরেশন প্রিভিলেজ',
      seasonEn: 'Autumn Festival Season',
      seasonBn: 'শারদীয় উৎসব স্পেশাল',
      discountPercent: 7,
      minOrderValueBdt: 1500,
      isActive: false,
    },
  ];

  async getActiveFestivalCampaign(subtotal: number = 0) {
    const active = this.festivalCampaigns.find((c) => c.isActive);
    if (!active) return null;

    const isEligible = subtotal >= active.minOrderValueBdt;
    const calculatedDiscount = isEligible
      ? Math.round(subtotal * (active.discountPercent / 100))
      : 0;

    return {
      id: active.id,
      nameEn: active.nameEn,
      nameBn: active.nameBn,
      seasonEn: active.seasonEn,
      seasonBn: active.seasonBn,
      discountPercent: active.discountPercent,
      minOrderValueBdt: active.minOrderValueBdt,
      isEligible,
      amountNeeded: isEligible ? 0 : active.minOrderValueBdt - subtotal,
      calculatedDiscount,
    };
  }

  async listFestivalCampaigns() {
    return this.festivalCampaigns;
  }

  async toggleFestivalCampaign(campaignId: string, isActive: boolean) {
    const campaign = this.festivalCampaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      throw new NotFoundException(`Festival campaign "${campaignId}" not found`);
    }
    campaign.isActive = isActive;
    return campaign;
  }
}
