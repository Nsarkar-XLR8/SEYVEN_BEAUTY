import { Test, TestingModule } from '@nestjs/testing';
import { FacetService } from './facet.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { LotStatus, PublicationState } from '@prisma/client';

describe('FacetService', () => {
  let service: FacetService;
  let prisma: PrismaService;

  const mockProducts = [
    {
      id: 'prod-1',
      slug: 'cica-barrier-cream',
      titleEn: 'Cica Barrier Repair Cream',
      titleBn: 'সিকা ব্যারিয়ার ক্রিম',
      shortDescriptionEn: 'Formulated with ceramides and panthenol for skin barrier repair',
      dermalProtocolEn: 'Apply morning and night after serum',
      isPregnancySafe: true,
      isLactationSafe: true,
      category: {
        id: 'cat-1',
        slug: 'moisturizers',
        nameEn: 'Moisturizers',
        nameBn: 'ময়েশ্চারাইজার',
      },
      variants: [
        {
          id: 'var-1',
          sku: 'SEY-CICA-CREAM-50ML',
          priceBdt: 1850,
          lots: [
            {
              id: 'lot-1',
              availableQuantity: 50,
              reservedQuantity: 5,
              status: LotStatus.ACTIVE,
            },
          ],
        },
      ],
      ingredients: [],
    },
    {
      id: 'prod-2',
      slug: 'salicylic-acid-cleanser',
      titleEn: 'Salicylic Acid Acne Cleanser',
      titleBn: 'স্যালিসিলিক অ্যাসিড একনে ক্লিনজার',
      shortDescriptionEn: 'BHA gentle purifying cleanser for acne and blemishes',
      dermalProtocolEn: 'Use once daily',
      isPregnancySafe: false,
      isLactationSafe: true,
      category: {
        id: 'cat-2',
        slug: 'cleansers',
        nameEn: 'Cleansers',
        nameBn: 'ক্লিনজার',
      },
      variants: [
        {
          id: 'var-2',
          sku: 'SEY-BHA-CLEANSER-150ML',
          priceBdt: 950,
          lots: [
            {
              id: 'lot-2',
              availableQuantity: 100,
              reservedQuantity: 0,
              status: LotStatus.ACTIVE,
            },
          ],
        },
      ],
      ingredients: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacetService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockResolvedValue(mockProducts),
              count: jest.fn().mockResolvedValue(2),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            setex: jest.fn().mockResolvedValue('OK'),
          },
        },
      ],
    }).compile();

    service = module.get<FacetService>(FacetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute aggregate dynamic facet counts accurately', async () => {
    const facets = await service.getFacets();

    expect(facets).toBeDefined();
    expect(facets.totalProducts).toBe(2);

    // Categories
    expect(facets.categories.length).toBe(2);
    expect(facets.categories.find((c) => c.slug === 'moisturizers')?.count).toBe(1);

    // Concerns
    const barrier = facets.concerns.find((c) => c.id === 'barrier_repair');
    expect(barrier?.count).toBe(1);
    const acne = facets.concerns.find((c) => c.id === 'acne_blemishes');
    expect(acne?.count).toBe(1);

    // Routines
    const cleanser = facets.routines.find((r) => r.id === 'cleanser');
    expect(cleanser?.count).toBe(1);

    // Price brackets
    expect(facets.priceBrackets.under_1000).toBe(1); // 950 BDT
    expect(facets.priceBrackets.bdt_1000_2500).toBe(1); // 1850 BDT

    // Safety & Stock
    expect(facets.safety.pregnancySafe).toBe(1);
    expect(facets.safety.lactationSafe).toBe(2);
    expect(facets.stock.inStock).toBe(2);
  });

  it('should query products by taxonomy with pagination and enriched metadata', async () => {
    const result = await service.queryTaxonomy({
      concern: 'barrier',
      page: 1,
      limit: 10,
    });

    expect(result.data.length).toBe(2);
    expect(result.meta.total).toBe(2);
    expect(result.data[0].variants[0].availableStock).toBe(45); // 50 - 5
  });
});
