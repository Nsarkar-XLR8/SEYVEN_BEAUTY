import { Test, TestingModule } from '@nestjs/testing';
import { PdpService } from './pdp.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { PreviewTokenService } from './preview-token.service';
import { SchemaOrgService } from './schema-org.service';
import { ShippingEstimatorService } from './shipping-estimator.service';
import { LotStatus, PublicationState } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PdpService', () => {
  let service: PdpService;
  let prisma: PrismaService;

  const mockProduct = {
    id: 'prod-1',
    slug: 'cica-barrier-cream',
    titleEn: 'Cica Barrier Repair Cream',
    titleBn: 'Cica Barrier Repair Cream',
    shortDescriptionEn: 'Clinical barrier cream with ceramides and centella',
    shortDescriptionBn: 'Clinical barrier cream with ceramides and centella',
    dermalProtocolEn: 'Apply twice daily',
    patchTestGuideEn: 'Patch test behind the ear for 24 hours',
    storageGuidanceEn: 'Store away from direct heat',
    paoMonths: 12,
    isPregnancySafe: true,
    isLactationSafe: true,
    bstiStatus: 'APPROVED',
    bstiLicenseNumber: 'BSTI-LIC-2026-9901',
    publicationState: PublicationState.PUBLISHED,
    category: { id: 'cat-1', nameEn: 'Moisturizers', slug: 'moisturizers' },
    variants: [
      {
        id: 'var-1',
        sku: 'SEY-CICA-50ML',
        barcode: '8941234567890',
        volumeMlG: 50,
        priceBdt: 1850,
        compareAtPriceBdt: 2200,
        weightGrams: 200,
        isBundle: false,
        lots: [
          {
            id: 'lot-1',
            availableQuantity: 40,
            reservedQuantity: 5,
            status: LotStatus.ACTIVE,
          },
        ],
      },
    ],
    ingredients: [
      {
        orderIndex: 0,
        concentrationPercent: 5.0,
        ingredient: {
          id: 'ing-1',
          inciName: 'Centella Asiatica Extract',
          commonNameEn: 'Centella Asiatica (Cica)',
          commonNameBn: 'Centella Asiatica (Cica)',
          dermalPurpose: 'Soothing & Anti-inflammatory',
          comedogenicRating: 0,
          isPregnancySafe: true,
          isLactationSafe: true,
          phRangeMin: 5.0,
          phRangeMax: 6.5,
        },
      },
    ],
    claims: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdpService,
        SchemaOrgService,
        ShippingEstimatorService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.slug === 'cica-barrier-cream') return Promise.resolve(mockProduct);
                return Promise.resolve(null);
              }),
            },
          },
        },
        {
          provide: PreviewTokenService,
          useValue: {
            verifyPreviewToken: jest.fn().mockReturnValue('prod-1'),
          },
        },
      ],
    }).compile();

    service = module.get<PdpService>(PdpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should assemble comprehensive composite PDP data bundle', async () => {
    const pdp = await service.getProductDetailPage('cica-barrier-cream');

    expect(pdp).toBeDefined();
    expect(pdp.product.id).toBe('prod-1');
    expect(pdp.product.slug).toBe('cica-barrier-cream');
    expect(pdp.product.variants[0].availableStock).toBe(35); // 40 - 5
    expect(pdp.product.variants[0].stockStatus).toBe('IN_STOCK');
    expect(pdp.product.minPriceBdt).toBe(1850);
    expect(pdp.product.inciBreakdown.length).toBe(0);

    // FAQs
    expect(pdp.faqs.length).toBe(4);

    // Shipping estimates
    expect(pdp.shippingEstimates.insideDhaka.zone).toBe('INSIDE_DHAKA');
    expect(pdp.shippingEstimates.outsideDhaka.zone).toBe('OUTSIDE_DHAKA');

    // Schema.org
    expect(pdp.schemaOrg.productJsonLd).toBeDefined();
    expect(pdp.schemaOrg.faqJsonLd).toBeDefined();
    expect(pdp.schemaOrg.breadcrumbJsonLd).toBeDefined();
  });

  it('should throw NotFoundException if product does not exist', async () => {
    await expect(
      service.getProductDetailPage('non-existent-product'),
    ).rejects.toThrow(NotFoundException);
  });
});
