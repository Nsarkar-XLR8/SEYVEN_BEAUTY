import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InventoryLot, LotStatus } from '@prisma/client';

export interface LotAllocation {
  lotId: string;
  batchNumber: string;
  expiryDate: Date;
  quantityAllocated: number;
}

@Injectable()
export class FefoPickerService {
  private readonly logger = new Logger(FefoPickerService.name);

  /**
   * First-Expiry-First-Out (FEFO) lot allocator enforcing minimum remaining shelf-life threshold.
   */
  allocateFefoLots(
    availableLots: InventoryLot[],
    requestedQuantity: number,
    enforceShelfLife = true,
  ): LotAllocation[] {
    if (requestedQuantity <= 0) {
      throw new BadRequestException('Requested quantity must be greater than zero');
    }

    const now = Date.now();
    const allocations: LotAllocation[] = [];
    let remainingToAllocate = requestedQuantity;

    // Filter active lots and sort by earliest expiry date (FEFO)
    const sortedLots = availableLots
      .filter((lot) => lot.status === LotStatus.ACTIVE)
      .filter((lot) => {
        if (!enforceShelfLife) return true;
        const expiryMs = new Date(lot.expiryDate).getTime();
        const daysRemaining = (expiryMs - now) / (1000 * 60 * 60 * 24);
        const minShelfLife = lot.minShelfLifeDays || 90;
        return daysRemaining >= minShelfLife;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    for (const lot of sortedLots) {
      if (remainingToAllocate <= 0) break;

      const unreservedStock = Math.max(0, lot.availableQuantity - lot.reservedQuantity);
      if (unreservedStock <= 0) continue;

      const allocQty = Math.min(unreservedStock, remainingToAllocate);
      allocations.push({
        lotId: lot.id,
        batchNumber: lot.batchNumber,
        expiryDate: lot.expiryDate,
        quantityAllocated: allocQty,
      });

      remainingToAllocate -= allocQty;
    }

    if (remainingToAllocate > 0) {
      throw new BadRequestException(
        `Insufficient inventory to fulfill requested quantity (${requestedQuantity}). Remaining unfulfillable: ${remainingToAllocate}`,
      );
    }

    this.logger.debug(
      `[FEFO Picker] Allocated ${requestedQuantity} units across ${allocations.length} lot(s)`,
    );

    return allocations;
  }
}
