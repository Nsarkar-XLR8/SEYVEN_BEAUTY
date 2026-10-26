import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicationState } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { SitemapService } from './sitemap.service';

describe('SitemapService', () => {
  let service: SitemapService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            slug: 'seyven-niacinamide-10-serum',
            updatedAt: new Date('2026-10-01T00:00:00Z'),
          },
          {
            slug: 'seyven-hyaluronic-acid-b5',
            updatedAt: new Date('2026-10-05T00:00:00Z'),
          },
        ]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([
          {
            slug: 'face-serums',
            createdAt: new Date('2026-09-01T00:00:00Z'),
          },
        ]),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitemapService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://seyven.com.bd'),
          },
        },
      ],
    }).compile();

    service = module.get<SitemapService>(SitemapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSitemapXml', () => {
    it('should return cached sitemap XML when present in Redis', async () => {
      const mockCachedXml = '<?xml version="1.0"?><urlset><url><loc>https://seyven.com.bd/</loc></url></urlset>';
      redis.get.mockResolvedValueOnce(mockCachedXml);

      const xml = await service.getSitemapXml();

      expect(xml).toBe(mockCachedXml);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should generate valid sitemap XML containing products and categories when not cached', async () => {
      const xml = await service.getSitemapXml();

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('<loc>https://seyven.com.bd/</loc>');
      expect(xml).toContain('<loc>https://seyven.com.bd/catalog</loc>');
      expect(xml).toContain('<loc>https://seyven.com.bd/products/seyven-niacinamide-10-serum</loc>');
      expect(xml).toContain('<loc>https://seyven.com.bd/category/face-serums</loc>');
      expect(redis.set).toHaveBeenCalledWith(
        'seo:sitemap:xml',
        expect.stringContaining('<urlset'),
        3600,
      );
    });
  });

  describe('invalidateSitemapCache', () => {
    it('should delete the sitemap cache key in Redis', async () => {
      await service.invalidateSitemapCache();
      expect(redis.del).toHaveBeenCalledWith('seo:sitemap:xml');
    });
  });
});
