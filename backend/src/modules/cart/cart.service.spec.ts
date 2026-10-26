import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: any;
  let redis: RedisService;

  const mockPrisma = {
    productVariant: {
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return empty cart when no items exist and calculate free delivery progress accurately', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce(null);

      const res = await service.getCart('user-1');

      expect(res).toBeDefined();
      expect(res.cartId).toBe('cart:user:user-1');
      expect(res.items).toHaveLength(0);
      expect(res.summary.subtotal).toBe(0);
      expect(res.summary.freeDelivery.isEligible).toBe(false);
      expect(res.summary.freeDelivery.threshold).toBe(2000);
      expect(res.summary.freeDelivery.amountNeeded).toBe(2000);
      expect(res.summary.freeDelivery.progressPercentage).toBe(0);
    });

    it('should calculate live subtotal, regular price, savings, and free delivery eligibility when over ৳2,000 threshold', async () => {
      const storedItems = [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Hydrating Cleanser',
          variantName: '150ml',
          sku: 'SYV-CLN-150',
          unitPrice: 1650,
          regularPrice: 1850,
          quantity: 2,
          addedAt: new Date().toISOString(),
        },
      ];
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedItems));

      const res = await service.getCart(undefined, 'guest_test_token');

      expect(res.items).toHaveLength(1);
      expect(res.summary.subtotal).toBe(3300); // 1650 * 2
      expect(res.summary.totalRegularPrice).toBe(3700); // 1850 * 2
      expect(res.summary.totalSavings).toBe(400); // 3700 - 3300
      expect(res.summary.freeDelivery.isEligible).toBe(true);
      expect(res.summary.freeDelivery.amountNeeded).toBe(0);
      expect(res.summary.freeDelivery.progressPercentage).toBe(100);
      expect(redis.set).toHaveBeenCalledWith(
        'cart:guest:guest_test_token',
        JSON.stringify(storedItems),
        7 * 24 * 60 * 60,
      );
    });
  });

  describe('addItem', () => {
    it('should add a new product variant to cart', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'var-1',
        sku: 'SYV-SRM-30',
        priceBdt: '2450.00',
        compareAtPriceBdt: '2800.00',
        volumeMlG: '30.00',
        weightGrams: 150,
        product: {
          titleEn: 'Vitamin C 15% Serum',
          titleBn: 'ভিটামিন সি ১৫% সিরাম',
        },
      });

      const res = await service.addItem(
        {
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 1,
        },
        'user-1',
      );

      expect(res.items).toHaveLength(1);
      expect(res.items[0].unitPrice).toBe(2450);
      expect(res.items[0].regularPrice).toBe(2800);
      expect(res.summary.subtotal).toBe(2450);
      expect(res.summary.freeDelivery.isEligible).toBe(true);
    });

    it('should increment quantity if variant is already present in cart', async () => {
      const existing = [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Vitamin C Serum',
          variantName: '30ml',
          sku: 'SYV-SRM-30',
          unitPrice: 2450,
          regularPrice: 2800,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const res = await service.addItem(
        {
          productId: 'prod-1',
          variantId: 'var-1',
          quantity: 2,
        },
        'user-1',
      );

      expect(res.items).toHaveLength(1);
      expect(res.items[0].quantity).toBe(3);
      expect(res.summary.subtotal).toBe(7350);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity successfully', async () => {
      const existing = [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Moisturizer',
          variantName: '50ml',
          sku: 'SYV-MOI-50',
          unitPrice: 1950,
          regularPrice: 2200,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const res = await service.updateItemQuantity('var-1', { quantity: 4 }, 'user-1');

      expect(res.items[0].quantity).toBe(4);
      expect(res.summary.subtotal).toBe(7800);
    });

    it('should remove item when quantity is set to 0', async () => {
      const existing = [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Moisturizer',
          variantName: '50ml',
          sku: 'SYV-MOI-50',
          unitPrice: 1950,
          regularPrice: 2200,
          quantity: 2,
          addedAt: new Date().toISOString(),
        },
      ];
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const res = await service.updateItemQuantity('var-1', { quantity: 0 }, 'user-1');

      expect(res.items).toHaveLength(0);
      expect(res.summary.subtotal).toBe(0);
    });

    it('should throw NotFoundException if item does not exist in cart', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      await expect(
        service.updateItemQuantity('non-existent', { quantity: 2 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem and clearCart', () => {
    it('should remove specific item by ID', async () => {
      const existing = [
        {
          id: 'item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Item 1',
          variantName: '50ml',
          sku: 'SKU-1',
          unitPrice: 1000,
          regularPrice: 1200,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
        {
          id: 'item-2',
          productId: 'prod-2',
          variantId: 'var-2',
          title: 'Item 2',
          variantName: '100ml',
          sku: 'SKU-2',
          unitPrice: 1500,
          regularPrice: 1700,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
      (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const res = await service.removeItem('var-1', 'user-1');

      expect(res.items).toHaveLength(1);
      expect(res.items[0].variantId).toBe('var-2');
    });

    it('should clear entire cart session', async () => {
      const res = await service.clearCart('user-1');
      expect(res.items).toHaveLength(0);
      expect(res.summary.subtotal).toBe(0);
    });
  });

  describe('mergeCart', () => {
    it('should merge guest items into user cart and purge guest cart key', async () => {
      const guestItems = [
        {
          id: 'guest-item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Item 1',
          variantName: '50ml',
          sku: 'SKU-1',
          unitPrice: 1000,
          regularPrice: 1200,
          quantity: 2,
          addedAt: new Date().toISOString(),
        },
      ];
      const userItems = [
        {
          id: 'user-item-1',
          productId: 'prod-1',
          variantId: 'var-1',
          title: 'Item 1',
          variantName: '50ml',
          sku: 'SKU-1',
          unitPrice: 1000,
          regularPrice: 1200,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];

      (redis.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(guestItems))
        .mockResolvedValueOnce(JSON.stringify(userItems));

      const res = await service.mergeCart('guest_123', 'user_456');

      expect(res.items).toHaveLength(1);
      expect(res.items[0].quantity).toBe(3); // 1 + 2
      expect(res.summary.subtotal).toBe(3000);
      expect(redis.set).toHaveBeenCalledWith('cart:guest:guest_123', JSON.stringify([]), 60);
    });

    it('should throw BadRequestException if guestToken or userId is missing', async () => {
      await expect(service.mergeCart('', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
