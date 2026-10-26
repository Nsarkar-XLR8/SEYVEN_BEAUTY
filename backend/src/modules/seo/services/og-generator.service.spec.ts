import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/database/prisma.service';
import { OgGeneratorService } from './og-generator.service';

describe('OgGeneratorService', () => {
  let service: OgGeneratorService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OgGeneratorService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OgGeneratorService>(OgGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateProductOgCard', () => {
    it('should throw NotFoundException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.generateProductOgCard('non-existent-product'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate a 1200x630 SVG with product details, BDT price, and BSTI seal', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-uuid-1',
        slug: 'seyven-niacinamide-10-serum',
        titleEn: 'Seyven Niacinamide 10% + Zinc PCA 1%',
        titleBn: 'সেভেন নায়াসিনামাইড ১০%',
        paoMonths: 12,
        bstiLicenseNumber: 'BSTI-COS-9012',
        bstiStatus: 'APPROVED',
        category: {
          nameEn: 'Targeted Serums',
        },
        variants: [
          {
            priceBdt: '1450.00',
            compareAtPriceBdt: '1650.00',
          },
        ],
      });

      const svg = await service.generateProductOgCard('seyven-niacinamide-10-serum');

      expect(svg).toContain('<svg width="1200" height="630"');
      expect(svg).toContain('S E Y V E N');
      expect(svg).toContain('Seyven Niacinamide 10% + Zinc PCA 1%');
      expect(svg).toContain('সেভেন নায়াসিনামাইড ১০%');
      expect(svg).toContain('৳1,450');
      expect(svg).toContain('৳1,650');
      expect(svg).toContain('BSTI CERTIFIED: BSTI-COS-9012');
      expect(svg).toContain('Niacinamide 10%');
      expect(svg).toContain('Zinc PCA 1%');
    });
  });
});
