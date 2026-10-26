import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryReservationService } from './inventory-reservation.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { RedlockService } from '../../../common/redis/redlock.service';
import { ConfigService } from '@nestjs/config';
import { LotStatus } from '@prisma/client';

describe('InventoryReservationService', () => {
  let service: InventoryReservationService;
  let redis: RedisService;
  let redlock: RedlockService;

  const mockPhysicalVariant = {
    id: 'variant-physical-1',
    sku: 'SEY-CENTELLA-SERUM-50ML',
    isBundle: false,
    bundleComponents: [],
  };

  const mockBundleVariant = {
    id: 'variant-bundle-1',
    sku: 'SEY-DUO-KIT-COMBO',
    isBundle: true,
    bundleComponents: [
      {
        id: 'comp-1',
        bundleVariantId: 'variant-bundle-1',
        childVariantId: 'variant-physical-1',
        quantity: 2,
        childVariant: { id: 'variant-physical-1', sku: 'SEY-CENTELLA-SERUM-50ML' },
      },
    ],
  };

  const futureExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days ahead
  const mockLots = [
    {
      id: 'lot-1',
      variantId: 'variant-physical-1',
      batchNumber: 'BATCH-2026-A',
      expiryDate: futureExpiry,
      availableQuantity: 10,
      reservedQuantity: 0,
      status: LotStatus.ACTIVE,
    },
    {
      id: 'lot-2',
      variantId: 'variant-physical-1',
      batchNumber: 'BATCH-2026-B',
      expiryDate: new Date(futureExpiry.getTime() + 30 * 24 * 60 * 60 * 1000),
      availableQuantity: 20,
      reservedQuantity: 0,
      status: LotStatus.ACTIVE,
    },
  ];

  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      productVariant: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === 'variant-physical-1') return Promise.resolve(mockPhysicalVariant);
          if (where.id === 'variant-bundle-1') return Promise.resolve(mockBundleVariant);
          return Promise.resolve(null);
        }),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue(JSON.parse(JSON.stringify(mockLots))),
        findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          const lot = mockLots.find((l) => l.id === where.id);
          return Promise.resolve(lot ? JSON.parse(JSON.stringify(lot)) : null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      inventoryAuditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryReservationService,
        RedisService,
        RedlockService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((k, def) => def) },
        },
      ],
    }).compile();

    service = module.get<InventoryReservationService>(InventoryReservationService);
    redis = module.get<RedisService>(RedisService);
    redlock = module.get<RedlockService>(RedlockService);
    redis.onModuleInit();
  });

  afterEach(async () => {
    await redis.onModuleDestroy();
    service.onModuleDestroy();
  });

  describe('Stage 1: RESERVE', () => {
    it('should successfully reserve stock for standalone physical SKU', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-physical-1', quantity: 5 }],
        ttlSeconds: 900,
      });

      expect(reservation).toBeDefined();
      expect(reservation.status).toBe('RESERVED');
      expect(reservation.allocations.length).toBe(1);
      expect(reservation.allocations[0].allocatedQuantity).toBe(5);
      expect(reservation.allocations[0].batchNumber).toBe('BATCH-2026-A');
    });

    it('should successfully reserve combo bundle stock by expanding child physical SKUs', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-bundle-1', quantity: 3 }], // requires 3 * 2 = 6 physical units
      });

      expect(reservation).toBeDefined();
      expect(reservation.status).toBe('RESERVED');
      expect(reservation.allocations.length).toBe(1);
      expect(reservation.allocations[0].allocatedQuantity).toBe(6);
    });

    it('should throw BadRequestException when available stock is insufficient', async () => {
      await expect(
        service.reserve({
          items: [{ variantId: 'variant-physical-1', quantity: 100 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Stage 2: CONFIRM', () => {
    it('should permanently commit reserved stock and create audit log', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-physical-1', quantity: 4 }],
      });

      const confirmed = await service.confirm({
        reservationId: reservation.reservationId,
        orderId: 'order-uuid-999',
      });

      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.orderId).toBe('order-uuid-999');
      expect(prismaMock.inventoryAuditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reservation is not found or expired', async () => {
      await expect(
        service.confirm({ reservationId: 'non-existent-res-id' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Stage 3: RELEASE', () => {
    it('should release held stock back to available pool', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-physical-1', quantity: 4 }],
      });

      const released = await service.release({
        reservationId: reservation.reservationId,
        reason: 'USER_ABANDONED_CART',
      });

      expect(released.status).toBe('RELEASED');
      expect(released.releaseReason).toBe('USER_ABANDONED_CART');
    });

    it('should prevent releasing an already confirmed reservation', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-physical-1', quantity: 4 }],
      });

      await service.confirm({ reservationId: reservation.reservationId });

      await expect(
        service.release({ reservationId: reservation.reservationId }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Automated Cleanup', () => {
    it('should automatically sweep expired reservations', async () => {
      const reservation = await service.reserve({
        items: [{ variantId: 'variant-physical-1', quantity: 2 }],
        ttlSeconds: 1, // 1 second
      });

      // Modify expiresAt to past in redis
      const raw = await redis.get(`inventory:reservation:${reservation.reservationId}`);
      const parsed = JSON.parse(raw!);
      parsed.expiresAt = new Date(Date.now() - 5000).toISOString();
      await redis.set(`inventory:reservation:${reservation.reservationId}`, JSON.stringify(parsed));

      const cleaned = await service.cleanupExpiredReservations();
      expect(cleaned).toBe(1);

      const check = await service.getReservation(reservation.reservationId);
      expect(check.status).toBe('RELEASED');
    });
  });
});
