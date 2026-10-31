import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetaCapiService } from './meta-capi.service';

describe('MetaCapiService', () => {
  let service: MetaCapiService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaCapiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'META_PIXEL_ID') return '123456789';
              if (key === 'META_CAPI_ACCESS_TOKEN') return 'test_token';
              if (key === 'META_TEST_EVENT_CODE') return 'TEST6825';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MetaCapiService>(MetaCapiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should gracefully skip if credentials are not configured', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);
    const result = await service.sendPurchaseEvent({
      eventId: 'ORD-123',
      orderNumber: 'ORD-123',
      totalAmount: 2500,
    });
    expect(result).toBe(false);
  });
});
