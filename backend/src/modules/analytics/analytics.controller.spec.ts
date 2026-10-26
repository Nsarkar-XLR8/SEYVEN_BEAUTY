import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetaCapiWorker } from './workers/meta-capi.worker';
import { TokenService } from '../auth/services/token.service';
import { IngestAnalyticsEventDto } from './dto/analytics-event.dto';
import { AttributionQueryDto } from './dto/attribution-query.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let metaWorker: jest.Mocked<MetaCapiWorker>;

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'staff-user-1',
      phone: '+8801712345678',
      role: 'SUPER_ADMIN',
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    const mockAnalytics = {
      ingestEvent: jest.fn().mockResolvedValue({
        success: true,
        eventId: 'evt_123',
        eventName: 'Purchase',
        isDuplicate: false,
        metaDispatched: true,
        ga4Dispatched: true,
      }),
      getAttributionReport: jest.fn().mockResolvedValue({
        period: { startDate: '2026-10-01', endDate: '2026-10-16' },
        summary: { totalOrders: 10, totalRevenueBdt: 25000, blendedRoas: 4.5 },
      }),
    };

    const mockMetaWorker = {
      getDlqEntries: jest.fn().mockResolvedValue([
        { jobId: 'job-1', eventId: 'evt-1', error: 'Failed' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: MetaCapiWorker, useValue: mockMetaWorker },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
    metaWorker = module.get(MetaCapiWorker);
  });

  describe('POST /analytics/events', () => {
    it('should extract client IP and user-agent and ingest event', async () => {
      const dto: IngestAnalyticsEventDto = {
        eventName: 'AddToCart',
        customData: { value: 1200 },
      };

      const mockReq = {
        headers: {
          'x-forwarded-for': '103.145.120.4, 10.0.0.1',
          'user-agent': 'Mozilla/5.0 Test Agent',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as any;

      const result = await controller.ingestEvent(dto, mockReq);

      expect(result.success).toBe(true);
      expect(analyticsService.ingestEvent).toHaveBeenCalledWith(
        dto,
        '103.145.120.4',
        'Mozilla/5.0 Test Agent',
        undefined,
      );
    });
  });

  describe('GET /admin/analytics/attribution', () => {
    it('should return attribution report', async () => {
      const query: AttributionQueryDto = {
        startDate: '2026-10-01',
        endDate: '2026-10-16',
        model: 'last_touch' as any,
      };

      const result = await controller.getAttributionReport(query);

      expect(result.summary.totalOrders).toBe(10);
      expect(analyticsService.getAttributionReport).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /admin/analytics/capi/dlq', () => {
    it('should query Meta CAPI DLQ entries', async () => {
      const result = await controller.getCapiDlq(25);

      expect(result).toHaveLength(1);
      expect(metaWorker.getDlqEntries).toHaveBeenCalledWith(25);
    });
  });
});
