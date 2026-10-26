import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateInventoryLotDto } from './dto/lot.dto';
import { StockAdjustmentDto } from './dto/adjustment.dto';
import { BatchRecallDto } from './dto/recall.dto';
import { FefoPickerService, LotAllocation } from './services/fefo-picker.service';
import { LotStatus, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fefoPickerService: FefoPickerService,
  ) {}

  // ---------------- Lot Batch Management ----------------
  async createLot(dto: CreateInventoryLotDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });
    if (!variant) {
      throw new NotFoundException(`Product variant with id "${dto.variantId}" not found`);
    }

    return this.prisma.inventoryLot.create({
      data: {
        variantId: dto.variantId,
        batchNumber: dto.batchNumber,
        manufacturingDate: new Date(dto.manufacturingDate),
        expiryDate: new Date(dto.expiryDate),
        paoMonths: dto.paoMonths || 12,
        initialQuantity: dto.initialQuantity,
        availableQuantity: dto.initialQuantity,
        minShelfLifeDays: dto.minShelfLifeDays || 90,
        status: LotStatus.ACTIVE,
      },
    });
  }

  async listLots(variantId?: string) {
    return this.prisma.inventoryLot.findMany({
      where: variantId ? { variantId } : undefined,
      include: {
        variant: {
          include: { product: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ---------------- Manual Stock Adjustment & Audit Logging ----------------
  async adjustLotQuantity(dto: StockAdjustmentDto, staffUserId?: string) {
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id: dto.lotId },
    });

    if (!lot) {
      throw new NotFoundException(`Inventory lot with id "${dto.lotId}" not found`);
    }

    const previousQuantity = lot.availableQuantity;
    const adjustmentDelta = dto.newQuantity - previousQuantity;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedLot = await tx.inventoryLot.update({
        where: { id: dto.lotId },
        data: {
          availableQuantity: dto.newQuantity,
          status: dto.newQuantity === 0 ? LotStatus.DEPLETED : lot.status,
        },
      });

      await tx.inventoryAuditLog.create({
        data: {
          lotId: dto.lotId,
          staffUserId,
          previousQuantity,
          newQuantity: dto.newQuantity,
          adjustmentDelta,
          reasonCode: dto.reasonCode,
          notes: dto.notes,
        },
      });

      return {
        lot: updatedLot,
        adjustmentDelta,
        auditLogged: true,
      };
    });
  }

  // ---------------- FEFO Stock Picking Allocation ----------------
  async allocateStock(variantId: string, quantity: number): Promise<LotAllocation[]> {
    const availableLots = await this.prisma.inventoryLot.findMany({
      where: {
        variantId,
        status: LotStatus.ACTIVE,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return this.fefoPickerService.allocateFefoLots(availableLots, quantity, true);
  }

  // ---------------- Cosmetic Batch Recall & Quarantine ----------------
  async initiateBatchRecall(dto: BatchRecallDto, staffUserId?: string) {
    const matchingLots = await this.prisma.inventoryLot.findMany({
      where: {
        batchNumber: dto.batchNumber,
        ...(dto.variantId ? { variantId: dto.variantId } : {}),
      },
    });

    if (matchingLots.length === 0) {
      throw new NotFoundException(`No inventory lots found matching batch number "${dto.batchNumber}"`);
    }

    const totalUnitsAffected = matchingLots.reduce((sum: number, lot: { availableQuantity: number }) => sum + lot.availableQuantity, 0);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Quarantine all matching lots
      await tx.inventoryLot.updateMany({
        where: {
          batchNumber: dto.batchNumber,
          ...(dto.variantId ? { variantId: dto.variantId } : {}),
        },
        data: {
          status: LotStatus.RECALLED,
        },
      });

      // Create recall incident audit record
      const recallRecord = await tx.batchRecall.create({
        data: {
          batchNumber: dto.batchNumber,
          variantId: dto.variantId,
          reason: dto.reason,
          initiatedBy: staffUserId,
          totalUnitsAffected,
        },
      });

      return {
        recallId: recallRecord.id,
        batchNumber: dto.batchNumber,
        totalLotsQuarantined: matchingLots.length,
        totalUnitsAffected,
        status: 'BATCH_RECALLED_AND_QUARANTINED',
      };
    });
  }
}
