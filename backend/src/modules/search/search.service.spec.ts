import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LotStatus, PublicationState } from '@prisma/client';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockProducts = [
    {
      id: 'prod-1',
      slug: 'triple-ceramide-barrier-cream',
      titleEn: 'Triple Ceramide Barrier Cream',
      titleBn: 'ট্রিপল সিরামাইড ব্যারিয়ার ক্রিম',
      shortDescriptionEn: 'Formulated with Ceramides NP/AP/EOP and Panthenol for lipid barrier repair',
      shortDescriptionBn: 'ত্বকের সুরক্ষায় সিরামাইড ক্রিম',
      dermalProtocolEn: 'Apply morning and night',
      isPregnancySafe: true,
      category: { id: 'cat-1', slug: 'moisturizers', nameEn: 'Moisturizers', nameBn: 'ময়েশ্চারাইজার' },
      variants: [
        {
          id: 'var-1',
          priceBdt: 1950,
          lots: [{ availableQuantity: 30, reservedQuantity: 2, status: LotStatus.ACTIVE }],
        },
      ],
    },
    {
      id: 'prod-2',
      slug: 'salicylic-acid-2-percent-acne-serum',
      titleEn: 'Salicylic Acid 2% Acne Clarifying Serum',
      titleBn: 'স্যালিসিলিক অ্যাসিড ২% একনে সিরাম',
      shortDescriptionEn: 'Purifies clogged pores, reduces blemishes and acne breakouts',
      shortDescriptionBn: 'ব্রণ ও দাগ দূর করতে কার্যকর সিরাম',
      dermalProtocolEn: 'Apply 2-3 drops at night',
      isPregnancySafe: false,
      category: { id: 'cat-2', slug: 'serums', nameEn: 'Serums', nameBn: 'সিরাম' },
      variants: [
        {
          id: 'var-2',
          priceBdt: 1250,
          lots: [{ availableQuantity: 50, reservedQuantity: 0, status: LotStatus.ACTIVE }],
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockResolvedValue(mockProducts),
            },
            category: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'cat-2', slug: 'serums', nameEn: 'Serums', nameBn: 'সিরাম' },
              ]),
            },
            searchQueryLog: {
              create: jest.fn().mockResolvedValue({ id: 'log-1' }),
              findMany: jest.fn().mockResolvedValue([
                { id: 'log-1', query: 'snail mucin', normalizedQuery: 'snail mucin', totalResults: 0, createdAt: new Date() },
                { id: 'log-2', query: 'snail mucin', normalizedQuery: 'snail mucin', totalResults: 0, createdAt: new Date() },
              ]),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            sadd: jest.fn().mockResolvedValue(1),
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find products with direct English keyword search', async () => {
    const result = await service.search({ q: 'ceramide' });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0].slug).toBe('triple-ceramide-barrier-cream');
    expect(result.data[0].relevanceScore).toBeGreaterThan(50);
  });

  it('should expand colloquial Banglish and Bangla terms using synonym dictionary', async () => {
    // "bron" (Banglish for acne) should expand to acne/salicylic terms and match product 2
    const result = await service.search({ q: 'bron' });

    expect(result.expandedTerms).toContain('acne');
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0].slug).toBe('salicylic-acid-2-percent-acne-serum');
  });

  it('should match products with typos in search queries', async () => {
    // "salicilic" typo should match Salicylic Acid
    const result = await service.search({ q: 'salicilic' });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0].slug).toBe('salicylic-acid-2-percent-acne-serum');
  });

  it('should filter search results by pregnancy safety', async () => {
    const result = await service.search({ q: 'cream', isPregnancySafe: true });
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data[0].id).toBe('prod-1');
  });

  it('should return predictive typeahead suggestions, products and categories', async () => {
    const autocomplete = await service.autocomplete('sali');

    expect(autocomplete.query).toBe('sali');
    expect(autocomplete.products.length).toBeGreaterThanOrEqual(1);
    expect(autocomplete.categories.length).toBe(1);
    expect(autocomplete.suggestions.length).toBeGreaterThan(0);
  });

  it('should aggregate zero-result analytics logs for merchandising intelligence', async () => {
    const analytics = await service.getZeroResultAnalytics();

    expect(analytics.totalZeroResultLogs).toBe(2);
    expect(analytics.uniqueMissingQueries).toBe(1);
    expect(analytics.data[0].normalizedQuery).toBe('snail mucin');
    expect(analytics.data[0].missCount).toBe(2);
  });
});
