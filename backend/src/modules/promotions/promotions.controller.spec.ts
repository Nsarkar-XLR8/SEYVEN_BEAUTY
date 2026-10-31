import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { DiscountType } from './interfaces/promotion.interface';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: PromotionsService;

  const mockValidationResult = {
    isValid: true,
    code: 'WELCOME10',
    titleEn: '10% Welcome',
    titleBn: '10% Welcome',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    calculatedDiscount: 350,
    freeShipping: false,
    message: 'Applied',
    messageBn: 'Applied',
  };

  const mockPromotionsService = {
    validateCoupon: jest.fn().mockResolvedValue(mockValidationResult),
    applyCouponToCart: jest.fn().mockResolvedValue({ success: true }),
    removeCouponFromCart: jest.fn().mockResolvedValue({ success: true }),
    getActivePromotions: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        {
          provide: PromotionsService,
          useValue: mockPromotionsService,
        },
      ],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
    service = module.get<PromotionsService>(PromotionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should validate coupon via POST /coupons/validate', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { code: 'WELCOME10', subtotal: 3500 };
    const res = await controller.validateCoupon(dto, req);

    expect(res).toBeDefined();
    expect(service.validateCoupon).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should apply coupon via POST /cart/apply-coupon', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { code: 'WELCOME10' };
    const res = await controller.applyCouponToCart(dto, req);

    expect(res).toBeDefined();
    expect(service.applyCouponToCart).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should remove coupon via DELETE /cart/coupon', async () => {
    const req = { user: { userId: 'u1' } } as any;
    const dto = { guestToken: 'g1' };
    const res = await controller.removeCouponFromCart(dto, req);

    expect(res).toBeDefined();
    expect(service.removeCouponFromCart).toHaveBeenCalledWith('g1', 'u1');
  });

  it('should get active promotions via GET /promotions/active', async () => {
    const res = await controller.getActivePromotions();
    expect(res).toBeDefined();
    expect(service.getActivePromotions).toHaveBeenCalled();
  });
});
