import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { RedlockService } from '../../../common/redis/redlock.service';
import { MIN_SHELF_LIFE_DAYS } from '../../../common/constants';
import { LotStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmStockDto, ReleaseStockDto, ReserveStockDto } from '../dto/reservation.dto';

export interface LotReservationAllocation {
  lotId: string;
  batchNumber: string;
  physicalVariantId: string;
  requestedVariantId: string;
  allocatedQuantity: number;
  expiryDate: string;
}

export interface StoredReservation {
  reservationId: string;
  status: 'RESERVED' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  ttlSeconds: number;
  cartId?: string;
  userId?: string;
  orderId?: string;
  releasedAt?: string;
  releaseReason?: string;
  confirmedAt?: string;
  allocations: LotReservationAllocation[];
}

@Injectable()
export class InventoryReservationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InventoryReservationService.name);
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly redlock: RedlockService,
  ) {}

  onModuleInit() {
    // Automated background cleaner checking for expired unconfirmed stock reservations every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations().catch((err) => {
        this.logger.error(`Error during automated reservation cleanup: ${err.message}`);
      });
    }, 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Stage 1: RESERVE — Locks temporary stock allocation with 15-minute default TTL.
   * Handles both standalone physical SKUs and Virtual Combo Bundles atomically.
   */
  async reserve(dto: ReserveStockDto): Promise<StoredReservation> {
    const ttlSeconds = dto.ttlSeconds || 900; // default 15 mins (900s)
    const reservationId = uuidv4();

    // 1. Resolve requested items into physical component items (expanding bundle SKUs)
    const physicalRequirements = new Map<string, { requestedVariantId: string; quantity: number; sku: string }>();

    for (const item of dto.items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          bundleComponents: {
            include: { childVariant: true },
          },
        },
      });

      if (!variant) {
        throw new NotFoundException(`Product variant with id "${item.variantId}" not found`);
      }

      if (variant.isBundle) {
        if (!variant.bundleComponents || variant.bundleComponents.length === 0) {
          throw new BadRequestException(`Bundle variant "${variant.sku}" has no configured physical components`);
        }

        for (const component of variant.bundleComponents) {
          const requiredQty = item.quantity * component.quantity;
          const current = physicalRequirements.get(component.childVariantId);
          if (current) {
            current.quantity += requiredQty;
          } else {
            physicalRequirements.set(component.childVariantId, {
              requestedVariantId: item.variantId,
              quantity: requiredQty,
              sku: component.childVariant.sku,
            });
          }
        }
      } else {
        const current = physicalRequirements.get(item.variantId);
        if (current) {
          current.quantity += item.quantity;
        } else {
          physicalRequirements.set(item.variantId, {
            requestedVariantId: item.variantId,
            quantity: item.quantity,
            sku: variant.sku,
          });
        }
      }
    }

    const physicalVariantIds = Array.from(physicalRequirements.keys());

    // 2. Concurrency Guard: Acquire distributed lock across all required physical SKUs
    return this.redlock.withLock(physicalVariantIds, async () => {
      const allocations: LotReservationAllocation[] = [];

      // 3. Atomic Database Transaction: Validate FEFO availability and increment reservedQuantity
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const now = new Date();
        const minExpiryThreshold = new Date(now.getTime() + MIN_SHELF_LIFE_DAYS * 24 * 60 * 60 * 1000);

        for (const [physicalVariantId, req] of physicalRequirements.entries()) {
          // Fetch active inventory lots for this variant ordered by FEFO (earliest expiry first)
          const lots = await tx.inventoryLot.findMany({
            where: {
              variantId: physicalVariantId,
              status: LotStatus.ACTIVE,
              expiryDate: { gte: minExpiryThreshold },
            },
            orderBy: { expiryDate: 'asc' },
          });

          // Calculate total available unreserved stock across valid lots
          let totalAvailable = 0;
          for (const lot of lots) {
            const availableInLot = Math.max(0, lot.availableQuantity - lot.reservedQuantity);
            totalAvailable += availableInLot;
          }

          if (totalAvailable < req.quantity) {
            throw new BadRequestException(
              `Insufficient stock for physical variant "${req.sku}". Required: ${req.quantity}, Available: ${totalAvailable}`,
            );
          }

          // Allocate required quantity from lots in FEFO order
          let remainingToAllocate = req.quantity;

          for (const lot of lots) {
            if (remainingToAllocate <= 0) break;

            const availableInLot = Math.max(0, lot.availableQuantity - lot.reservedQuantity);
            if (availableInLot <= 0) continue;

            const take = Math.min(availableInLot, remainingToAllocate);

            // Update reserved quantity on lot
            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: {
                reservedQuantity: lot.reservedQuantity + take,
              },
            });

            allocations.push({
              lotId: lot.id,
              batchNumber: lot.batchNumber,
              physicalVariantId,
              requestedVariantId: req.requestedVariantId,
              allocatedQuantity: take,
              expiryDate: new Date(lot.expiryDate).toISOString(),
            });

            remainingToAllocate -= take;
          }
        }
      });

      // 4. Record Reservation in Redis with 15-minute TTL
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      const reservationRecord: StoredReservation = {
        reservationId,
        status: 'RESERVED',
        createdAt: new Date().toISOString(),
        expiresAt,
        ttlSeconds,
        cartId: dto.cartId,
        userId: dto.userId,
        allocations,
      };

      await this.redis.setex(
        `inventory:reservation:${reservationId}`,
        ttlSeconds,
        JSON.stringify(reservationRecord),
      );
      await this.redis.sadd('inventory:active_reservations', reservationId);

      this.logger.log(
        `🔒 [Stock Reserved] Reservation ${reservationId} created with ${allocations.length} lot allocations (TTL: ${ttlSeconds}s)`,
      );

      return reservationRecord;
    });
  }

  /**
   * Stage 2: CONFIRM — Commits stock deduction post-payment authorization.
   * Permanently reduces lot availableQuantity and unfreezes reservedQuantity in a DB transaction.
   */
  async confirm(dto: ConfirmStockDto): Promise<StoredReservation> {
    const rawData = await this.redis.get(`inventory:reservation:${dto.reservationId}`);
    if (!rawData) {
      throw new NotFoundException(`Stock reservation "${dto.reservationId}" not found or expired`);
    }

    const reservation: StoredReservation = JSON.parse(rawData);

    if (reservation.status === 'CONFIRMED') {
      return reservation;
    }

    if (reservation.status !== 'RESERVED') {
      throw new BadRequestException(
        `Cannot confirm stock reservation with status "${reservation.status}"`,
      );
    }

    const physicalVariantIds = Array.from(new Set(reservation.allocations.map((a) => a.physicalVariantId)));

    return this.redlock.withLock(physicalVariantIds, async () => {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const allocation of reservation.allocations) {
          const lot = await tx.inventoryLot.findUnique({
            where: { id: allocation.lotId },
          });

          if (!lot) {
            throw new NotFoundException(`Inventory lot with id "${allocation.lotId}" not found`);
          }

          const previousQuantity = lot.availableQuantity;
          const newAvailableQuantity = Math.max(0, lot.availableQuantity - allocation.allocatedQuantity);
          const newReservedQuantity = Math.max(0, lot.reservedQuantity - allocation.allocatedQuantity);

          await tx.inventoryLot.update({
            where: { id: allocation.lotId },
            data: {
              availableQuantity: newAvailableQuantity,
              reservedQuantity: newReservedQuantity,
              status: newAvailableQuantity === 0 ? LotStatus.DEPLETED : lot.status,
            },
          });

          // Create permanent inventory audit trail record
          await tx.inventoryAuditLog.create({
            data: {
              lotId: allocation.lotId,
              previousQuantity,
              newQuantity: newAvailableQuantity,
              adjustmentDelta: -allocation.allocatedQuantity,
              reasonCode: 'CHECKOUT_ORDER_CONFIRMED',
              notes: `Committed reservation ${dto.reservationId} for order ${dto.orderId || 'N/A'}`,
            },
          });
        }
      });

      reservation.status = 'CONFIRMED';
      reservation.confirmedAt = new Date().toISOString();
      reservation.orderId = dto.orderId;

      await this.redis.set(`inventory:reservation:${dto.reservationId}`, JSON.stringify(reservation));
      await this.redis.srem('inventory:active_reservations', dto.reservationId);

      this.logger.log(`✅ [Stock Committed] Reservation ${dto.reservationId} successfully confirmed`);
      return reservation;
    });
  }

  /**
   * Stage 3: RELEASE — Explicitly unfreezes held stock allocations back to the available lot pool.
   */
  async release(dto: ReleaseStockDto): Promise<StoredReservation> {
    const rawData = await this.redis.get(`inventory:reservation:${dto.reservationId}`);
    if (!rawData) {
      throw new NotFoundException(`Stock reservation "${dto.reservationId}" not found`);
    }

    const reservation: StoredReservation = JSON.parse(rawData);

    if (reservation.status === 'RELEASED') {
      return reservation;
    }

    if (reservation.status === 'CONFIRMED') {
      throw new ConflictException(
        `Cannot release reservation "${dto.reservationId}" because it has already been committed to an order`,
      );
    }

    const physicalVariantIds = Array.from(new Set(reservation.allocations.map((a) => a.physicalVariantId)));

    return this.redlock.withLock(physicalVariantIds, async () => {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const allocation of reservation.allocations) {
          const lot = await tx.inventoryLot.findUnique({
            where: { id: allocation.lotId },
          });

          if (lot) {
            const newReservedQuantity = Math.max(0, lot.reservedQuantity - allocation.allocatedQuantity);
            await tx.inventoryLot.update({
              where: { id: allocation.lotId },
              data: {
                reservedQuantity: newReservedQuantity,
              },
            });

            await tx.inventoryAuditLog.create({
              data: {
                lotId: allocation.lotId,
                previousQuantity: lot.availableQuantity,
                newQuantity: lot.availableQuantity,
                adjustmentDelta: 0,
                reasonCode: 'RESERVATION_RELEASED',
                notes: `Released stock reservation ${dto.reservationId}. Reason: ${dto.reason || 'MANUAL_RELEASE'}`,
              },
            });
          }
        }
      });

      reservation.status = 'RELEASED';
      reservation.releasedAt = new Date().toISOString();
      reservation.releaseReason = dto.reason || 'MANUAL_RELEASE';

      await this.redis.set(`inventory:reservation:${dto.reservationId}`, JSON.stringify(reservation));
      await this.redis.srem('inventory:active_reservations', dto.reservationId);

      this.logger.log(`🔓 [Stock Released] Reservation ${dto.reservationId} successfully released`);
      return reservation;
    });
  }

  /**
   * Retrieves reservation status and itemized lot allocations.
   */
  async getReservation(reservationId: string): Promise<StoredReservation> {
    const rawData = await this.redis.get(`inventory:reservation:${reservationId}`);
    if (!rawData) {
      throw new NotFoundException(`Stock reservation "${reservationId}" not found`);
    }
    return JSON.parse(rawData);
  }

  /**
   * Background Worker / Cron: Sweeps and releases expired unconfirmed stock reservations.
   */
  async cleanupExpiredReservations(): Promise<number> {
    const activeIds = await this.redis.smembers('inventory:active_reservations');
    if (!activeIds || activeIds.length === 0) {
      return 0;
    }

    let cleanedCount = 0;
    const now = Date.now();

    for (const resId of activeIds) {
      try {
        const rawData = await this.redis.get(`inventory:reservation:${resId}`);
        if (!rawData) {
          // Key expired from Redis, clean set reference
          await this.redis.srem('inventory:active_reservations', resId);
          continue;
        }

        const reservation: StoredReservation = JSON.parse(rawData);
        const expiresAtTime = new Date(reservation.expiresAt).getTime();

        if (now >= expiresAtTime && reservation.status === 'RESERVED') {
          await this.release({
            reservationId: resId,
            reason: 'AUTOMATED_EXPIRATION_CLEANUP',
          });
          cleanedCount++;
        }
      } catch (err) {
        this.logger.warn(`Failed to cleanup reservation ${resId}: ${(err as Error).message}`);
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 [Reservation Cleaner] Automatically released ${cleanedCount} expired reservation(s)`);
    }

    return cleanedCount;
  }
}
