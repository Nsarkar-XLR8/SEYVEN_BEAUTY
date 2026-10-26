import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/database/prisma.service';
import { DeduplicationService } from './services/deduplication.service';
import { MetaCapiWorker } from './workers/meta-capi.worker';
import { Ga4Client } from './services/ga4.client';
import { AttributionService } from './services/attribution.service';
import { IngestAnalyticsEventDto } from './dto/analytics-event.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;
  let dedupService: jest.Mocked<DeduplicationService>;
  let metaWorker: jest.Mocked<MetaCapiWorker>;
  let ga4Client: jest.Mocked<Ga4Client>;
  let attributionService: jest.Mocked<AttributionService>;

  beforeEach(async () => {
    prisma = {
      marketingEvent: {
        create: jest.fn().mockResolvedValue({ id: 'me-123' }),
      },
    };

    const mockDedup = {
      generateSharedEventId: jest.fn().mockReturnValue('sey_purchase_order123'),
      registerAndCheck: jest.fn().mockResolvedValue({
        isDuplicate: false,
        eventId: 'sey_purchase_order123',
      }),
    };

    const mockMetaWorker = {
      dispatchWithRetry: jest.fn().mockResolvedValue({
        events_received: 1,
        messages: [],
        fbtrace_id: 'fb_trace_123',
      }),
    };

    const mockGa4Client = {
      mapToGa4EventName: jest.fn().mockReturnValue('purchase'),
      dispatchEvent: jest.fn().mockResolvedValue({
        success: true,
        statusCode: 204,
      }),
    };

    const mockAttribution = {
      getAttributionReport: jest.fn().mockResolvedValue({
        summary: { totalOrders: 5 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DeduplicationService, useValue: mockDedup },
        { provide: MetaCapiWorker, useValue: mockMetaWorker },
        { provide: Ga4Client, useValue: mockGa4Client },
        { provide: AttributionService, useValue: mockAttribution },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    dedupService = module.get(DeduplicationService);
    metaWorker = module.get(MetaCapiWorker);
    ga4Client = module.get(Ga4Client);
    attributionService = module.get(AttributionService);
  });

  describe('ingestEvent', () => {
    it('should hash PII, dispatch to CAPI & GA4, and record in DB for new event', async () => {
      const dto: IngestAnalyticsEventDto = {
        eventName: 'Purchase',
        userData: {
          phone: '01712345678',
          email: 'ayesha@seyven.com',
          clientIp: '103.145.120.4',
        },
        customData: {
          value: 3500,
          currency: 'BDT',
          orderId: 'SYV-202610-A9F1B2',
          contents: [
            { id: 'SKU-01', quantity: 1, itemPrice: 3500 },
          ],
        },
      };

      const result = await service.ingestEvent(dto);

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false);
      expect(result.metaDispatched).toBe(true);
      expect(result.ga4Dispatched).toBe(true);

      // Meta payload should have SHA-256 hashed phone (starting with 88017...) and email
      expect(metaWorker.dispatchWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'Purchase',
          user_data: expect.objectContaining({
            ph: expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/)]),
            em: expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/)]),
            client_ip_address: '103.145.120.4',
          }),
        }),
      );

      // GA4 dispatch called
      expect(ga4Client.dispatchEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'purchase' }),
        undefined,
      );

      // DB record created
      expect(prisma.marketingEvent.create).toHaveBeenCalled();
    });

    it('should skip CAPI dispatch when event is marked duplicate', async () => {
      dedupService.registerAndCheck.mockResolvedValueOnce({
        isDuplicate: true,
        eventId: 'sey_dup_123',
      });

      const dto: IngestAnalyticsEventDto = {
        eventName: 'AddToCart',
        eventId: 'sey_dup_123',
      };

      const result = await service.ingestEvent(dto);

      expect(result.isDuplicate).toBe(true);
      expect(metaWorker.dispatchWithRetry).not.toHaveBeenCalled();
    });
  });

  describe('trackOrderPurchase', () => {
    it('should format order into Purchase event and ingest', async () => {
      const order = {
        id: 'ord-123',
        orderNumber: 'SYV-202610-A9F1B2',
        guestPhone: '01712345678',
        totalPayableBdt: 4200,
        shippingAddress: {
          fullName: 'Tanvir Hossain',
          district: 'Dhaka',
          division: 'Dhaka',
        },
        items: [
          { sku: 'SYV-CRM-01', quantity: 2, unitPriceBdt: 2100, title: 'Barrier Repair Cream' },
        ],
        metaEventId: 'purchase_SYV-202610-A9F1B2',
      };

      const result = await service.trackOrderPurchase(order, '103.145.120.5', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(metaWorker.dispatchWithRetry).toHaveBeenCalled();
    });
  });

  describe('getAttributionReport', () => {
    it('should delegate to AttributionService', async () => {
      const query = { model: 'first_touch' as any };
      const report = await service.getAttributionReport(query);

      expect(attributionService.getAttributionReport).toHaveBeenCalledWith(query);
      expect(report.summary.totalOrders).toBe(5);
    });
  });
});
