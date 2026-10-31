import { Test, TestingModule } from '@nestjs/testing';
import { NavigationService } from './navigation.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let redis: RedisService;
  let prisma: PrismaService;

  const mockCategories = [
    {
      id: 'cat-1',
      slug: 'serums-treatments',
      nameEn: 'Serums & Treatments',
      nameBn: 'Serums & Treatments',
      description: 'Active dermal serums',
      parentId: null,
      _count: { products: 12 },
      children: [
        {
          id: 'child-1',
          slug: 'niacinamide-serums',
          nameEn: 'Niacinamide Serums',
          nameBn: 'Niacinamide Serums',
          description: 'Pore refining',
          _count: { products: 5 },
        },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn().mockResolvedValue(mockCategories),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            setex: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
            keys: jest.fn().mockResolvedValue(['cache:catalog:facets:all']),
          },
        },
      ],
    }).compile();

    service = module.get<NavigationService>(NavigationService);
    redis = module.get<RedisService>(RedisService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate hierarchical Mega-Menu with categories, concerns, routines, and textures', async () => {
    const menu = await service.getMegaMenu();

    expect(menu).toBeDefined();
    expect(menu.categories.length).toBe(1);
    expect(menu.categories[0].slug).toBe('serums-treatments');
    expect(menu.categories[0].children?.length).toBe(1);

    expect(menu.concerns.length).toBeGreaterThanOrEqual(5);
    expect(menu.concerns.find((c) => c.slug === 'barrier-repair')).toBeDefined();

    expect(menu.routines.length).toBeGreaterThanOrEqual(5);
    expect(menu.routines.find((r) => r.slug === 'cleanser')).toBeDefined();

    expect(menu.activeIngredients.length).toBeGreaterThanOrEqual(5);
    expect(redis.setex).toHaveBeenCalled();
  });

  it('should return cached menu if available in Redis', async () => {
    const cachedData = {
      categories: [],
      concerns: [],
      routines: [],
      formulations: [],
      activeIngredients: [],
      cachedAt: '2026-10-02T10:00:00.000Z',
    };
    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(cachedData));

    const menu = await service.getMegaMenu();
    expect(menu.cachedAt).toBe('2026-10-02T10:00:00.000Z');
    expect(prisma.category.findMany).not.toHaveBeenCalled();
  });

  it('should invalidate catalog caches', async () => {
    await service.invalidateCatalogCaches();
    expect(redis.del).toHaveBeenCalled();
  });
});
