import { Test, TestingModule } from '@nestjs/testing';
import { WaitlistService } from './waitlist.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.id === 'prod-1') return Promise.resolve({ id: 'prod-1', titleEn: 'Cica Cream' });
                return Promise.resolve(null);
              }),
            },
            productVariant: {
              findUnique: jest.fn().mockResolvedValue({ id: 'var-1' }),
            },
            productWaitlist: {
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'waitlist-1', ...data, createdAt: new Date() })),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WaitlistService>(WaitlistService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should subscribe customer to restock alert with normalized E.164 phone', async () => {
    const result = await service.subscribe('prod-1', {
      phone: '01712345678',
      email: 'user@example.com',
    });

    expect(result.status).toBe('SUBSCRIBED');
    expect(result.phone).toBe('+8801712345678');
    expect(result.productId).toBe('prod-1');
  });

  it('should throw NotFoundException if product is not found', async () => {
    await expect(
      service.subscribe('non-existent-product', { phone: '01712345678' }),
    ).rejects.toThrow(NotFoundException);
  });
});
