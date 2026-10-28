import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { TokenService } from '../auth/services/token.service';
import { SeoController } from './seo.controller';
import { OgGeneratorService } from './services/og-generator.service';
import { RedirectService } from './services/redirect.service';
import { SitemapService } from './services/sitemap.service';

describe('SeoController', () => {
  let controller: SeoController;
  let sitemapService: any;
  let ogGeneratorService: any;
  let redirectService: any;

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'usr-admin-1',
      phone: '',
      role: UserRole.SUPER_ADMIN,
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    sitemapService = {
      getSitemapXml: jest.fn().mockResolvedValue('<?xml version="1.0"?><urlset></urlset>'),
      invalidateSitemapCache: jest.fn().mockResolvedValue(undefined),
    };

    ogGeneratorService = {
      generateProductOgCard: jest.fn().mockResolvedValue('<svg width="1200" height="630"></svg>'),
    };

    redirectService = {
      getRedirects: jest.fn().mockResolvedValue({ total: 1, items: [] }),
      createRedirect: jest.fn().mockResolvedValue({ id: 'red-1', sourcePath: '/old', targetPath: '/new' }),
      resolveRedirect: jest.fn().mockResolvedValue({ found: true, targetPath: '/new', statusCode: 301 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeoController],
      providers: [
        { provide: SitemapService, useValue: sitemapService },
        { provide: OgGeneratorService, useValue: ogGeneratorService },
        { provide: RedirectService, useValue: redirectService },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<SeoController>(SeoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSitemapXml', () => {
    it('should call sitemapService.getSitemapXml and return XML string', async () => {
      const result = await controller.getSitemapXml();
      expect(sitemapService.getSitemapXml).toHaveBeenCalled();
      expect(result).toContain('<urlset>');
    });
  });

  describe('getProductOgCard', () => {
    it('should call ogGeneratorService.generateProductOgCard with slug', async () => {
      const result = await controller.getProductOgCard('seyven-niacinamide-10');
      expect(ogGeneratorService.generateProductOgCard).toHaveBeenCalledWith('seyven-niacinamide-10');
      expect(result).toContain('<svg');
    });
  });

  describe('getRedirects', () => {
    it('should return paginated redirects from redirectService', async () => {
      const result = await controller.getRedirects({ page: 1, limit: 10 });
      expect(redirectService.getRedirects).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
    });
  });

  describe('createRedirect', () => {
    it('should call redirectService.createRedirect with dto', async () => {
      const dto = { sourcePath: '/old-serum', targetPath: '/products/seyven-serum', statusCode: 301 };
      const result = await controller.createRedirect(dto);
      expect(redirectService.createRedirect).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('red-1');
    });
  });

  describe('resolveRedirect', () => {
    it('should call redirectService.resolveRedirect with path query', async () => {
      const result = await controller.resolveRedirect('/old-url');
      expect(redirectService.resolveRedirect).toHaveBeenCalledWith('/old-url');
      expect(result.found).toBe(true);
      expect(result.targetPath).toBe('/new');
    });
  });

  describe('invalidateSitemap', () => {
    it('should call sitemapService.invalidateSitemapCache', async () => {
      const result = await controller.invalidateSitemap();
      expect(sitemapService.invalidateSitemapCache).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
