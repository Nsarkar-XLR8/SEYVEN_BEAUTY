import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { RedlockService } from '../../common/redis/redlock.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { CartService } from '../cart/cart.service';
import { PromotionsService } from '../promotions/promotions.service';
import { InventoryReservationService } from '../inventory/services/inventory-reservation.service';
import { GeoZoneService } from './services/geo-zone.service';
import { BadRequestException } from '@nestjs/common';
import { PaymentGatewayOption } from './dto/checkout.dto';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let prisma: any;
  let redis: RedisService;
  let redlock: RedlockService;
  let cartService: CartService;
  let promoService: PromotionsService;
  let inventoryResService: InventoryReservationService;

  const mockCart = {
    cartId: 'cart:guest:g1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        title: 'Vitamin C Serum',
        sku: 'SYV-SRM-30',
        unitPrice: 2450,
        regularPrice: 2800,
        quantity: 1,
        lineSubtotal: 2450,
        weightGrams: 200,
      },
    ],
    summary: {
      subtotal: 2450,
      totalRegularPrice: 2800,
      totalSavings: 350,
      totalPayable: 2450,
    },
  };

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback({
        order: { create: jest.fn().mockResolvedValue({ id: 'order-123' }) },
        orderItem: { create: jest.fn().mockResolvedValue({}) },
        userConsentLog: { create: jest.fn().mockResolvedValue({}) },
      });
    }),
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  };

  const mockRedlock = {
    acquireLock: jest.fn().mockResolvedValue({
      resource: 'lock:test',
      token: 'tok-123',
      ttlMs: 15000,
      acquiredAt: Date.now(),
    }),
    releaseLock: jest.fn().mockResolvedValue(true),
  };

  const mockOutbox = {
    publish: jest.fn().mockResolvedValue({}),
  };

  const mockCartService = {
    getCart: jest.fn().mockResolvedValue(mockCart),
    clearCart: jest.fn().mockResolvedValue({}),
  };

  const mockPromoService = {
    validateCoupon: jest.fn().mockResolvedValue({
      isValid: true,
      code: 'WELCOME10',
      calculatedDiscount: 245,
      freeShipping: false,
    }),
  };

  const mockInventoryRes = {
    reserve: jest.fn().mockResolvedValue({ reservationId: 'res-123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        GeoZoneService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: RedlockService, useValue: mockRedlock },
        { provide: OutboxPublisher, useValue: mockOutbox },
        { provide: CartService, useValue: mockCartService },
        { provide: PromotionsService, useValue: mockPromoService },
        { provide: InventoryReservationService, useValue: mockInventoryRes },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    redlock = module.get<RedlockService>(RedlockService);
    cartService = module.get<CartService>(CartService);
    promoService = module.get<PromotionsService>(PromotionsService);
    inventoryResService = module.get<InventoryReservationService>(InventoryReservationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCheckout', () => {
    it('should calculate live totals with free delivery when subtotal >= ৳2,000', async () => {
      const dto = {
        shippingAddress: {
          fullName: 'Ayesha Rahman',
          phone: '01712345678',
          division: 'Dhaka',
          district: 'Dhaka',
          thanaArea: 'Dhanmondi',
          streetAddress: 'House 1, Road 2',
        },
        paymentGateway: PaymentGatewayOption.COD,
      };

      const result = await service.calculateCheckout(dto);

      expect(result.subtotal).toBe(2450);
      expect(result.isFreeDelivery).toBe(true);
      expect(result.deliveryFee).toBe(0);
      expect(result.totalPayable).toBe(2450);
      expect(result.codDue).toBe(2450);
    });

    it('should calculate delivery fee when subtotal is below ৳2,000 threshold', async () => {
      (cartService.getCart as jest.Mock).mockResolvedValueOnce({
        items: [
          {
            productId: 'p1',
            variantId: 'v1',
            quantity: 1,
            unitPrice: 1500,
            lineSubtotal: 1500,
            weightGrams: 200,
          },
        ],
        summary: { subtotal: 1500, totalRegularPrice: 1700, totalSavings: 200 },
      });

      const dto = {
        shippingAddress: {
          fullName: 'Tanvir Hossain',
          phone: '01812345678',
          division: 'Chittagong',
          district: 'Chittagong',
          thanaArea: 'Agrabad',
          streetAddress: 'CDA R/A',
        },
        paymentGateway: PaymentGatewayOption.COD,
      };

      const result = await service.calculateCheckout(dto);

      expect(result.subtotal).toBe(1500);
      expect(result.isFreeDelivery).toBe(false);
      expect(result.deliveryFee).toBe(120); // Zone 3 outside Dhaka
      expect(result.totalPayable).toBe(1620); // 1500 + 120
    });
  });

  describe('commitCheckout', () => {
    it('should successfully place order, reserve inventory, log consent, and trigger outbox event', async () => {
      const dto = {
        shippingAddress: {
          fullName: 'Ayesha Rahman',
          phone: '01712345678',
          division: 'Dhaka',
          district: 'Dhaka',
          thanaArea: 'Dhanmondi',
          streetAddress: 'House 1, Road 2',
        },
        paymentGateway: PaymentGatewayOption.COD,
        termsAccepted: true,
        privacyConsentAccepted: true,
      };

      const res = await service.commitCheckout(
        dto,
        'idemp-key-test-123',
        '127.0.0.1',
        'TestRunner',
        'user-1',
      );

      expect(res).toBeDefined();
      expect(res.orderNumber).toMatch(/^SYV-\d{6}-[A-Z0-9]{6}$/);
      expect(res.status).toBe('PLACED');
      expect(res.totalPayable).toBe(2450);
      expect(cartService.clearCart).toHaveBeenCalled();
      expect(inventoryResService.reserve).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException if terms are not accepted', async () => {
      const dto = {
        shippingAddress: {
          fullName: 'Ayesha Rahman',
          phone: '01712345678',
          division: 'Dhaka',
          district: 'Dhaka',
          thanaArea: 'Dhanmondi',
          streetAddress: 'House 1, Road 2',
        },
        paymentGateway: PaymentGatewayOption.COD,
        termsAccepted: false,
        privacyConsentAccepted: true,
      };

      await expect(
        service.commitCheckout(dto, 'idemp-key-1', '127.0.0.1', 'TestRunner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return cached order on duplicate idempotency key', async () => {
      const cached = {
        orderId: 'cached-order-1',
        orderNumber: 'SYV-202610-CACHED',
        status: 'PLACED',
        totalPayable: 2450,
      };
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

      const dto = {
        shippingAddress: {
          fullName: 'Ayesha Rahman',
          phone: '01712345678',
          division: 'Dhaka',
          district: 'Dhaka',
          thanaArea: 'Dhanmondi',
          streetAddress: 'House 1, Road 2',
        },
        paymentGateway: PaymentGatewayOption.COD,
        termsAccepted: true,
        privacyConsentAccepted: true,
      };

      const res = await service.commitCheckout(
        dto,
        'idemp-key-replay',
        '127.0.0.1',
        'TestRunner',
      );

      expect(res.orderId).toBe('cached-order-1');
      expect(res.idempotentReplay).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
