import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { ReplenishmentEngineService } from './replenishment-engine.service';

describe('ReplenishmentEngineService', () => {
  let service: ReplenishmentEngineService;
  let prisma: any;

  const mockDeliveredOrders = [
    {
      id: 'ord-rep-1',
      orderNumber: 'SYV-202610-R1',
      status: OrderStatus.DELIVERED,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
      userId: 'usr-1',
      guestName: null,
      guestPhone: null,
      user: {
        id: 'usr-1',
        fullName: 'Sabrina Mostafa',
        phone: '+8801711002233',
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-sun-1',
          title: 'Daily Water Sunscreen SPF50+',
          quantity: 1,
          isGwp: false,
        },
        {
          id: 'item-2',
          productId: 'prod-gwp-1',
          title: 'Free Travel Pouch',
          quantity: 1,
          isGwp: true, // Should be skipped
        },
      ],
    },
    {
      id: 'ord-rep-2',
      orderNumber: 'SYV-202610-R2',
      status: OrderStatus.DELIVERED,
      createdAt: new Date('2026-09-15T00:00:00Z'),
      updatedAt: new Date('2026-09-15T00:00:00Z'),
      userId: 'usr-2',
      guestName: null,
      guestPhone: null,
      user: {
        id: 'usr-2',
        fullName: 'Fahim Hasan',
        phone: '+8801811002233',
      },
      items: [
        {
          id: 'item-3',
          productId: 'prod-toner-1',
          title: 'Heartleaf Calming Moisture Toner 250ml',
          quantity: 1,
          isGwp: false,
        },
      ],
    },
  ];

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(mockDeliveredOrders),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplenishmentEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReplenishmentEngineService>(ReplenishmentEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateProductLifespan', () => {
    it('should assign 30 days for sunscreen products', () => {
      const res = service.estimateProductLifespan('Hydra Sunscreen SPF 50+');
      expect(res.lifespanDays).toBe(30);
      expect(res.category).toBe('Sun Protection');
    });

    it('should assign 45 days for serum and ampoule products', () => {
      const res = service.estimateProductLifespan('Niacinamide Glow Serum 30ml');
      expect(res.lifespanDays).toBe(45);
      expect(res.category).toBe('Targeted Treatment');
    });

    it('should assign 60 days for toner products', () => {
      const res = service.estimateProductLifespan('AHA BHA Clarifying Toner 150ml');
      expect(res.lifespanDays).toBe(60);
      expect(res.category).toBe('Toner & Prep');
    });

    it('should fallback to 45 days for unclassified cosmetic items', () => {
      const res = service.estimateProductLifespan('Lip Sleeping Butter');
      expect(res.lifespanDays).toBe(45);
      expect(res.category).toBe('General Skincare');
    });
  });

  describe('getReplenishmentPredictions', () => {
    it('should generate predictions and skip GWP free items', async () => {
      const result = await service.getReplenishmentPredictions({
        dueWithinDays: 90,
        limit: 10,
      });

      expect(result.predictions).toBeDefined();
      // Only 2 real items (sunscreen and toner), gwp item excluded
      expect(result.predictions).toHaveLength(2);

      const sunscreenPred = result.predictions.find((p) =>
        p.productTitle.includes('Sunscreen'),
      );
      expect(sunscreenPred).toBeDefined();
      expect(sunscreenPred?.customerName).toBe('Sabrina Mostafa');
      expect(sunscreenPred?.estimatedLifespanDays).toBe(30);
      expect(sunscreenPred?.suggestedChannel).toBe('WHATSAPP');

      const tonerPred = result.predictions.find((p) =>
        p.productTitle.includes('Toner'),
      );
      expect(tonerPred).toBeDefined();
      expect(tonerPred?.customerName).toBe('Fahim Hasan');
      expect(tonerPred?.estimatedLifespanDays).toBe(60);
    });

    it('should sort predictions with most urgent / overdue items first', async () => {
      const result = await service.getReplenishmentPredictions({
        dueWithinDays: 90,
      });

      expect(result.predictions[0].daysUntilDepletion).toBeLessThanOrEqual(
        result.predictions[1].daysUntilDepletion,
      );
    });
  });
});
