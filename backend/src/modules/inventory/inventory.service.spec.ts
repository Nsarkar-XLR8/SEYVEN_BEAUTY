import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../common/database/prisma.service';
import { FefoPickerService } from './services/fefo-picker.service';
import { LotStatus } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;
  let fefoPickerService: FefoPickerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        FefoPickerService,
        {
          provide: PrismaService,
          useValue: {
            productVariant: {
              findUnique: jest.fn().mockResolvedValue({ id: 'var-1' }),
            },
            inventoryLot: {
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'lot-1', ...data })),
              findUnique: jest.fn().mockResolvedValue({
                id: 'lot-1',
                availableQuantity: 50,
                status: LotStatus.ACTIVE,
              }),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'lot-1',
                  batchNumber: 'BATCH-001',
                  availableQuantity: 50,
                  status: LotStatus.ACTIVE,
                },
              ]),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              const tx = {
                inventoryLot: {
                  update: jest.fn().mockResolvedValue({ id: 'lot-1', availableQuantity: 40 }),
                  updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                },
                inventoryAuditLog: {
                  create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
                },
                batchRecall: {
                  create: jest.fn().mockResolvedValue({ id: 'recall-1' }),
                },
              };
              return callback(tx);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    fefoPickerService = module.get<FefoPickerService>(FefoPickerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an inventory lot', async () => {
    const lot = await service.createLot({
      variantId: 'var-1',
      batchNumber: 'BATCH-2026-X',
      manufacturingDate: '2026-01-01',
      expiryDate: '2028-01-01',
      initialQuantity: 500,
    });

    expect(lot.id).toBe('lot-1');
    expect(lot.batchNumber).toBe('BATCH-2026-X');
  });

  it('should adjust lot quantity and create immutable audit log', async () => {
    const result = await service.adjustLotQuantity(
      {
        lotId: 'lot-1',
        newQuantity: 40,
        reasonCode: 'DAMAGE_WRITE_OFF',
        notes: 'Outer bottle cracked in warehouse',
      },
      'staff-user-id',
    );

    expect(result.auditLogged).toBe(true);
    expect(result.adjustmentDelta).toBe(-10);
  });

  it('should initiate batch recall and quarantine matching lots', async () => {
    const result = await service.initiateBatchRecall(
      {
        batchNumber: 'BATCH-001',
        reason: 'Packaging seal integrity failure',
      },
      'staff-admin-id',
    );

    expect(result.batchNumber).toBe('BATCH-001');
    expect(result.status).toBe('BATCH_RECALLED_AND_QUARANTINED');
    expect(result.totalUnitsAffected).toBe(50);
  });
});
