import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../common/database/prisma.service';
import { PreviewTokenService } from './services/preview-token.service';
import { NavigationService } from './services/navigation.service';
import { BstiStatus, PublicationState } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: PrismaService;
  let previewTokenService: PreviewTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: NavigationService,
          useValue: {
            invalidateCatalogCaches: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'cat-1', ...data })),
              findMany: jest.fn().mockResolvedValue([{ id: 'cat-1', slug: 'serums', nameEn: 'Serums' }]),
            },
            product: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'prod-1', ...data })),
              update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
            },
            productVariant: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'var-1', ...data })),
            },
            bundleItem: {
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              const tx = {
                productVariant: {
                  create: jest.fn().mockResolvedValue({ id: 'bundle-var-1', isBundle: true }),
                },
                bundleItem: {
                  createMany: jest.fn().mockResolvedValue({ count: 2 }),
                },
              };
              return callback(tx);
            }),
          },
        },
        {
          provide: PreviewTokenService,
          useValue: {
            generatePreviewToken: jest.fn().mockReturnValue('mock-signed-preview-token'),
            verifyPreviewToken: jest.fn().mockReturnValue('prod-1'),
          },
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    prisma = module.get<PrismaService>(PrismaService);
    previewTokenService = module.get<PreviewTokenService>(PreviewTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category with bilingual titles', async () => {
    const category = await service.createCategory({
      slug: 'serums',
      nameEn: 'Dermal Serums',
      nameBn: 'ডার্মাল সিরাম',
    });

    expect(category.id).toBe('cat-1');
    expect(category.nameBn).toBe('ডার্মাল সিরাম');
  });

  it('should create a product in DRAFT state', async () => {
    const product = await service.createProduct({
      slug: 'barrier-repair-serum',
      titleEn: 'Barrier Repair Serum',
      titleBn: 'ব্যারিয়ার রিপেয়ার সিরাম',
      publicationState: PublicationState.DRAFT,
    });

    expect(product.id).toBe('prod-1');
    expect(product.publicationState).toBe(PublicationState.DRAFT);
  });

  it('should update publication state to PUBLISHED', async () => {
    jest.spyOn(prisma.product, 'findUnique').mockResolvedValue({
      id: 'prod-1',
      slug: 'approved-serum',
      publicationState: PublicationState.DRAFT,
    } as any);

    const updated = await service.updatePublicationState('prod-1', PublicationState.PUBLISHED);
    expect(updated.publicationState).toBe(PublicationState.PUBLISHED);
  });

  it('should create a virtual bundle variant linking child SKUs', async () => {
    const bundle = await service.createVariant({
      productId: 'prod-1',
      sku: 'ROUTINE-KIT-01',
      volumeMlG: 100,
      priceBdt: 3500,
      cogsBdt: 1800,
      isBundle: true,
      bundleComponents: [
        { childVariantId: 'child-var-1', quantity: 1 },
        { childVariantId: 'child-var-2', quantity: 1 },
      ],
    });

    expect(bundle.isBundle).toBe(true);
  });
});
