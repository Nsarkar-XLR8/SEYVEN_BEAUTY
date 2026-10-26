import { Test, TestingModule } from '@nestjs/testing';
import { AttributionService } from './attribution.service';
import { PrismaService } from '../../../common/database/prisma.service';

describe('AttributionService', () => {
  let service: AttributionService;
  let prisma: any;

  const mockOrders = [
    {
      id: 'ord-1',
      orderNumber: 'SYV-202610-001',
      totalPayableBdt: 2000,
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'retinol_launch_q4',
      firstTouchUtm: { utmSource: 'facebook', utmMedium: 'cpc', utmCampaign: 'retinol_launch_q4' },
      lastTouchUtm: { utmSource: 'facebook', utmMedium: 'cpc', utmCampaign: 'retinol_launch_q4' },
      createdAt: new Date(),
    },
    {
      id: 'ord-2',
      orderNumber: 'SYV-202610-002',
      totalPayableBdt: 3000,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'serum_search',
      firstTouchUtm: { utmSource: 'facebook', utmMedium: 'cpc', utmCampaign: 'retinol_launch_q4' },
      lastTouchUtm: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'serum_search' },
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(mockOrders),
      },
      marketingEvent: {
        groupBy: jest.fn().mockResolvedValue([
          { eventName: 'PageView', _count: { id: 100 } },
          { eventName: 'ViewContent', _count: { id: 40 } },
          { eventName: 'AddToCart', _count: { id: 15 } },
          { eventName: 'InitiateCheckout', _count: { id: 8 } },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AttributionService>(AttributionService);
  });

  describe('getAttributionReport', () => {
    it('should calculate last-touch attribution breakdown', async () => {
      const report = await service.getAttributionReport({
        model: 'last_touch' as any,
      });

      expect(report.model).toBe('last_touch');
      expect(report.summary.totalOrders).toBe(2);
      expect(report.summary.totalRevenueBdt).toBe(5000);
      expect(report.summary.averageOrderValueBdt).toBe(2500);

      const fbChannel = report.channels.find((c) => c.channel === 'facebook');
      const googleChannel = report.channels.find((c) => c.channel === 'google');

      expect(fbChannel).toBeDefined();
      expect(fbChannel?.totalRevenueBdt).toBe(2000);
      expect(fbChannel?.ordersCount).toBe(1);

      expect(googleChannel).toBeDefined();
      expect(googleChannel?.totalRevenueBdt).toBe(3000);
      expect(googleChannel?.ordersCount).toBe(1);

      expect(report.funnel.pageViews).toBe(100);
      expect(report.funnel.viewContent).toBe(40);
      expect(report.funnel.addToCart).toBe(15);
      expect(report.funnel.initiateCheckout).toBe(8);
      expect(report.funnel.purchase).toBe(2);
    });

    it('should calculate first-touch attribution assigning ord-2 to facebook', async () => {
      const report = await service.getAttributionReport({
        model: 'first_touch' as any,
      });

      expect(report.model).toBe('first_touch');
      const fbChannel = report.channels.find((c) => c.channel === 'facebook');
      // In first_touch, both ord-1 and ord-2 had firstTouchUtm = facebook
      expect(fbChannel?.ordersCount).toBe(2);
      expect(fbChannel?.totalRevenueBdt).toBe(5000);
    });

    it('should calculate linear attribution splitting multi-channel orders', async () => {
      const report = await service.getAttributionReport({
        model: 'linear' as any,
      });

      expect(report.model).toBe('linear');
      const fbChannel = report.channels.find((c) => c.channel === 'facebook');
      const googleChannel = report.channels.find((c) => c.channel === 'google');

      // ord-1: 100% FB = 1 order, 2000 BDT
      // ord-2: 50% FB (1500 BDT), 50% Google (1500 BDT)
      expect(fbChannel?.ordersCount).toBe(2); // 1 + 0.5 rounded to 2
      expect(fbChannel?.totalRevenueBdt).toBe(3500);
      expect(googleChannel?.totalRevenueBdt).toBe(1500);
    });

    it('should provide default baseline channels when no orders exist', async () => {
      prisma.order.findMany.mockResolvedValueOnce([]);

      const report = await service.getAttributionReport({
        model: 'last_touch' as any,
      });

      expect(report.summary.totalOrders).toBe(0);
      expect(report.summary.totalRevenueBdt).toBe(0);
      expect(report.channels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
