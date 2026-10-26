import { FefoPickerService } from './fefo-picker.service';
import { InventoryLot, LotStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('FefoPickerService', () => {
  let service: FefoPickerService;

  beforeEach(() => {
    service = new FefoPickerService();
  });

  it('should allocate lots in First-Expiry-First-Out (FEFO) order', () => {
    const lots: InventoryLot[] = [
      {
        id: 'lot-far-expiry',
        variantId: 'var-1',
        batchNumber: 'BATCH-2027-01',
        manufacturingDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-12-31'),
        paoMonths: 12,
        initialQuantity: 100,
        availableQuantity: 50,
        reservedQuantity: 0,
        status: LotStatus.ACTIVE,
        minShelfLifeDays: 90,
        createdAt: new Date(),
      },
      {
        id: 'lot-earliest-expiry',
        variantId: 'var-1',
        batchNumber: 'BATCH-2026-05',
        manufacturingDate: new Date('2025-05-01'),
        expiryDate: new Date('2027-06-30'),
        paoMonths: 12,
        initialQuantity: 100,
        availableQuantity: 20,
        reservedQuantity: 0,
        status: LotStatus.ACTIVE,
        minShelfLifeDays: 90,
        createdAt: new Date(),
      },
    ];

    const allocations = service.allocateFefoLots(lots, 25);
    expect(allocations.length).toBe(2);
    // Earliest expiry picked first: 20 units from lot-earliest-expiry
    expect(allocations[0].lotId).toBe('lot-earliest-expiry');
    expect(allocations[0].quantityAllocated).toBe(20);
    // Remaining 5 units from lot-far-expiry
    expect(allocations[1].lotId).toBe('lot-far-expiry');
    expect(allocations[1].quantityAllocated).toBe(5);
  });

  it('should ignore lots that violate the 90-day remaining shelf-life threshold', () => {
    const lots: InventoryLot[] = [
      {
        id: 'lot-expired-soon',
        variantId: 'var-1',
        batchNumber: 'BATCH-NEAR-EXP',
        manufacturingDate: new Date('2025-01-01'),
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // Only 30 days remaining (< 90 threshold)
        paoMonths: 12,
        initialQuantity: 100,
        availableQuantity: 100,
        reservedQuantity: 0,
        status: LotStatus.ACTIVE,
        minShelfLifeDays: 90,
        createdAt: new Date(),
      },
      {
        id: 'lot-valid',
        variantId: 'var-1',
        batchNumber: 'BATCH-VALID',
        manufacturingDate: new Date('2026-01-01'),
        expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000), // 180 days remaining
        paoMonths: 12,
        initialQuantity: 100,
        availableQuantity: 10,
        reservedQuantity: 0,
        status: LotStatus.ACTIVE,
        minShelfLifeDays: 90,
        createdAt: new Date(),
      },
    ];

    const allocations = service.allocateFefoLots(lots, 5);
    expect(allocations.length).toBe(1);
    expect(allocations[0].lotId).toBe('lot-valid');
  });

  it('should throw BadRequestException if available quantity is insufficient', () => {
    const lots: InventoryLot[] = [];
    expect(() => service.allocateFefoLots(lots, 10)).toThrow(BadRequestException);
  });
});
