import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { RedirectService } from './redirect.service';

describe('RedirectService', () => {
  let service: RedirectService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      urlRedirect: {
        upsert: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<RedirectService>(RedirectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRedirect', () => {
    it('should throw BadRequestException if source and target are identical', async () => {
      await expect(
        service.createRedirect({
          sourcePath: '/catalog',
          targetPath: '/catalog',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert normalized redirect rule and invalidate cache', async () => {
      prisma.urlRedirect.upsert.mockResolvedValue({
        id: 'red-uuid-1',
        sourcePath: '/old-serum',
        targetPath: '/products/seyven-serum',
        statusCode: 301,
        isActive: true,
      });

      const result = await service.createRedirect({
        sourcePath: '/old-serum/',
        targetPath: '/products/seyven-serum',
      });

      expect(prisma.urlRedirect.upsert).toHaveBeenCalledWith({
        where: { sourcePath: '/old-serum' },
        create: {
          sourcePath: '/old-serum',
          targetPath: '/products/seyven-serum',
          statusCode: 301,
          isActive: true,
        },
        update: {
          targetPath: '/products/seyven-serum',
          statusCode: 301,
          isActive: true,
        },
      });
      expect(redis.del).toHaveBeenCalledWith('seo:redirect:/old-serum');
      expect(result.sourcePath).toBe('/old-serum');
    });
  });

  describe('getRedirects', () => {
    it('should return paginated redirects', async () => {
      prisma.urlRedirect.count.mockResolvedValue(1);
      prisma.urlRedirect.findMany.mockResolvedValue([
        {
          id: 'red-uuid-1',
          sourcePath: '/old-url',
          targetPath: '/new-url',
          statusCode: 301,
          hitCount: 42,
        },
      ]);

      const result = await service.getRedirects({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].hitCount).toBe(42);
    });
  });

  describe('resolveRedirect', () => {
    it('should return cached resolution when present in Redis', async () => {
      const cached = JSON.stringify({
        found: true,
        sourcePath: '/legacy',
        targetPath: '/modern',
        statusCode: 301,
      });
      redis.get.mockResolvedValueOnce(cached);

      const result = await service.resolveRedirect('/legacy');

      expect(result.found).toBe(true);
      expect(result.targetPath).toBe('/modern');
      expect(prisma.urlRedirect.findFirst).not.toHaveBeenCalled();
    });

    it('should lookup in database and return targetPath and statusCode', async () => {
      prisma.urlRedirect.findFirst.mockResolvedValue({
        id: 'red-uuid-1',
        sourcePath: '/legacy',
        targetPath: '/modern',
        statusCode: 301,
      });

      const result = await service.resolveRedirect('/legacy');

      expect(result.found).toBe(true);
      expect(result.targetPath).toBe('/modern');
      expect(result.statusCode).toBe(301);
      expect(redis.set).toHaveBeenCalledWith(
        'seo:redirect:/legacy',
        expect.stringContaining('"found":true'),
        300,
      );
    });

    it('should return found: false when no active redirect exists', async () => {
      prisma.urlRedirect.findFirst.mockResolvedValue(null);

      const result = await service.resolveRedirect('/unknown-path');

      expect(result.found).toBe(false);
      expect(redis.set).toHaveBeenCalledWith(
        'seo:redirect:/unknown-path',
        expect.stringContaining('"found":false'),
        60,
      );
    });
  });
});
