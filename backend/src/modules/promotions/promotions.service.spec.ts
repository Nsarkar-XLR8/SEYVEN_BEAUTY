import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CartService } from '../cart/cart.service';
import { AntiStackingValidator } from './guards/anti-stacking.validator';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DiscountType } from './interfaces/promotion.interface';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let prisma: any;
  let redis: RedisService;
  let cartService: CartService;
  let antiStacking: AntiStackingValidator;

  const mockPrisma = {
    coupon: {
      findUnique: jest.fn(),
    },
    order: {
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  };

  const mockCartService = {
    getCart: jest.fn().mockResolvedValue({
      cartId: 'cart:user:u1',
      items: [{ productId: 'p1', variantId: 'v1', quantity: 2, unitPrice: 2000 }],
      summary: {
        subtotal: 4000,
        totalPayable: 4000,
      },
    }),
    addItem: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        AntiStackingValidator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    cartService = module.get<CartService>(CartService);
    antiStacking = module.get<AntiStackingValidator>(AntiStackingValidator);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCoupon', () => {
    it('should validate 10% WELCOME10 coupon with max discount cap', async () => {
      const dto = {
        code: 'WELCOME10',
        subtotal: 6000, // 10% of 6000 = 600, capped at max 500
      };

      const result = await service.validateCoupon(dto, 'user-new');

      expect(result.isValid).toBe(true);
      expect(result.code).toBe('WELCOME10');
      expect(result.discountType).toBe(DiscountType.PERCENTAGE);
      expect(result.calculatedDiscount).toBe(500); // capped at maxDiscountBdt: 500
    });

    it('should validate ৳500 flat savings coupon DERMALVIP', async () => {
      const dto = {
        code: 'DERMALVIP',
        subtotal: 3500,
      };

      const result = await service.validateCoupon(dto);

      expect(result.isValid).toBe(true);
      expect(result.discountType).toBe(DiscountType.FIXED_AMOUNT);
      expect(result.calculatedDiscount).toBe(500);
    });

    it('should reject coupon if subtotal is below minimum order value threshold', async () => {
      const dto = {
        code: 'DERMALVIP',
        subtotal: 1500, // min spend is 3000
      };

      await expect(service.validateCoupon(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      const dto = {
        code: 'INVALID_CODE_999',
        subtotal: 5000,
      };

      await expect(service.validateCoupon(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyCouponToCart and removeCouponFromCart', () => {
    it('should attach coupon to cart and inject GWP if eligible', async () => {
      const dto = { code: 'GWPPREMIUM' };
      const res = await service.applyCouponToCart(dto, 'u1');

      expect(res).toBeDefined();
      expect(res.appliedCoupon.code).toBe('GWPPREMIUM');
      expect(cartService.addItem).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should detach coupon from cart', async () => {
      const res = await service.removeCouponFromCart(undefined, 'u1');
      expect(res).toBeDefined();
      expect(res.appliedCoupon).toBeNull();
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('getActivePromotions', () => {
    it('should return active promotions list', async () => {
      const list = await service.getActivePromotions();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].slug).toBeDefined();
    });
  });
});
