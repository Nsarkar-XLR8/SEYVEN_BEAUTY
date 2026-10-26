import { Test, TestingModule } from '@nestjs/testing';
import { RmaService } from './rma.service';
import { PrismaService } from '../../common/database/prisma.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { HygienePolicyManager } from './services/hygiene-policy.manager';
import { RegulatoryDeadlineManager } from './services/regulatory-deadline.manager';
import { RefundDisbursementService } from './services/refund-disbursement.service';
import {
  HygieneInspectionOutcome,
  OrderStatus,
  RefundChannel,
  RmaReason,
  RmaStatus,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RmaService', () => {
  let service: RmaService;
  let prisma: any;
  let hygienePolicyManager: HygienePolicyManager;
  let regulatoryDeadlineManager: RegulatoryDeadlineManager;
  let refundDisbursementService: jest.Mocked<RefundDisbursementService>;

  const mockOrder = {
    id: 'ord-uuid-1',
    orderNumber: 'SYV-202610-A9F1B2',
    status: OrderStatus.DELIVERED,
    guestPhone: '01712345678',
    guestName: 'Ayesha Rahman',
    totalPayableBdt: 3700,
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        sku: 'SYV-RET-01',
        title: '0.2% Pure Retinol Night Elixir',
        quantity: 2,
        unitPriceBdt: 1850,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue(mockOrder),
      },
      rmaRequest: {
        create: jest.fn().mockResolvedValue({ id: 'rma-1' }),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      rmaItem: {
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
      },
      $transaction: jest.fn(async (cb) => {
        const tx = {
          rmaRequest: { create: jest.fn().mockResolvedValue({ id: 'rma-1' }) },
          rmaItem: { create: jest.fn().mockResolvedValue({ id: 'rma-item-1' }) },
        };
        return cb(tx);
      }),
    };

    const mockOutbox = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    const mockRefundDisbursement = {
      disburseAndIssueCreditNote: jest.fn().mockResolvedValue({
        rmaNumber: 'RMA-202610-A9F1B2',
        orderNumber: 'SYV-202610-A9F1B2',
        status: RmaStatus.SETTLED,
        approvedRefundAmountBdt: 1850,
        refundChannel: RefundChannel.ORIGINAL_PAYMENT_METHOD,
        refundTrxId: 'RFD_BKASH_123',
        mushakCreditNoteSerial: 'CRN-SYV-202610-A1B2C3',
        settledAt: new Date().toISOString(),
        isRestocked: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RmaService,
        HygienePolicyManager,
        RegulatoryDeadlineManager,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: mockOutbox },
        { provide: RefundDisbursementService, useValue: mockRefundDisbursement },
      ],
    }).compile();

    service = module.get<RmaService>(RmaService);
    hygienePolicyManager = module.get<HygienePolicyManager>(HygienePolicyManager);
    regulatoryDeadlineManager = module.get<RegulatoryDeadlineManager>(RegulatoryDeadlineManager);
    refundDisbursementService = module.get(RefundDisbursementService);
  });

  describe('submitRmaRequest', () => {
    it('should successfully create an RMA request for a delivered order with evidence', async () => {
      const dto = {
        orderId: 'SYV-202610-A9F1B2',
        customerPhone: '01712345678',
        customerName: 'Ayesha Rahman',
        primaryReason: RmaReason.TRANSIT_DAMAGE,
        reasonDetails: 'Bottle broken in courier delivery transit',
        photoEvidenceUrls: ['https://storage.seyven.com/damage-01.jpg'],
        items: [{ orderItemId: 'item-1', quantity: 1 }],
      };

      const result = await service.submitRmaRequest(dto);

      expect(result.rmaNumber).toMatch(/^RMA-/);
      expect(result.status).toBe(RmaStatus.SUBMITTED);
      expect(result.requestedAmountBdt).toBe(1850);
      expect(result.deadlineStatus).toBeDefined();
      expect(result.deadlineStatus.isBreached).toBe(false);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.submitRmaRequest({
          orderId: 'NON_EXISTENT_ORDER',
          customerPhone: '01712345678',
          primaryReason: RmaReason.TRANSIT_DAMAGE,
          reasonDetails: 'Details',
          photoEvidenceUrls: ['https://example.com/photo.jpg'],
          items: [{ orderItemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject return if order is not delivered', async () => {
      prisma.order.findFirst.mockResolvedValueOnce({
        ...mockOrder,
        status: OrderStatus.PLACED,
      });

      await expect(
        service.submitRmaRequest({
          orderId: 'SYV-202610-A9F1B2',
          customerPhone: '01712345678',
          primaryReason: RmaReason.TRANSIT_DAMAGE,
          reasonDetails: 'Details',
          photoEvidenceUrls: ['https://example.com/photo.jpg'],
          items: [{ orderItemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('inspectRma', () => {
    it('should enforce cosmetic hygiene rule rejecting unsealed change-of-mind return', async () => {
      const mockRma = {
        id: 'rma-1',
        primaryReason: RmaReason.UNOPENED_MIND_CHANGE,
        requestedAmountBdt: 1850,
        photoEvidenceUrls: ['https://example.com/photo.jpg'],
        order: { updatedAt: new Date() },
        items: [],
      };
      prisma.rmaRequest.findUnique.mockResolvedValueOnce(mockRma);
      prisma.rmaRequest.update.mockResolvedValueOnce({
        ...mockRma,
        status: RmaStatus.REJECTED,
        inspectionOutcome: HygieneInspectionOutcome.REJECTED_HYGIENE_UNSEALED,
        isRestockable: false,
      });

      const inspectDto = {
        outcome: HygieneInspectionOutcome.PASSED_SEALED,
        isSealIntact: false, // Seal was broken!
        inspectionNotes: 'Customer unsealed the serum box; seal broken.',
        isRestockable: true,
      };

      const result = await service.inspectRma('rma-1', inspectDto, 'staff-01');

      expect(prisma.rmaRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RmaStatus.REJECTED,
            inspectionOutcome: HygieneInspectionOutcome.REJECTED_HYGIENE_UNSEALED,
            isRestockable: false,
            approvedRefundAmountBdt: 0,
          }),
        }),
      );
    });

    it('should approve valid transit damage with intact photo evidence', async () => {
      const mockRma = {
        id: 'rma-2',
        primaryReason: RmaReason.TRANSIT_DAMAGE,
        requestedAmountBdt: 1850,
        photoEvidenceUrls: ['https://example.com/transit-breakage.jpg'],
        order: { updatedAt: new Date() },
        items: [],
      };
      prisma.rmaRequest.findUnique.mockResolvedValueOnce(mockRma);
      prisma.rmaRequest.update.mockResolvedValueOnce({
        ...mockRma,
        status: RmaStatus.APPROVED,
        inspectionOutcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
        isRestockable: false,
      });

      const inspectDto = {
        outcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
        isSealIntact: false,
        inspectionNotes: 'Crushed packaging verified.',
        isRestockable: false,
      };

      await service.inspectRma('rma-2', inspectDto, 'staff-01');

      expect(prisma.rmaRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RmaStatus.APPROVED,
            inspectionOutcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
            isRestockable: false,
            approvedRefundAmountBdt: 1850,
          }),
        }),
      );
    });
  });

  describe('settleRma', () => {
    it('should delegate settlement and return settlement result', async () => {
      const mockRma = {
        id: 'rma-3',
        rmaNumber: 'RMA-202610-A9F1B2',
        status: RmaStatus.APPROVED,
        order: mockOrder,
        items: [],
      };
      prisma.rmaRequest.findUnique.mockResolvedValueOnce(mockRma);

      const settleDto = {
        approvedRefundAmountBdt: 1850,
        refundChannel: RefundChannel.ORIGINAL_PAYMENT_METHOD,
      };

      const result = await service.settleRma('rma-3', settleDto, 'finance-01');

      expect(result.status).toBe(RmaStatus.SETTLED);
      expect(refundDisbursementService.disburseAndIssueCreditNote).toHaveBeenCalled();
    });

    it('should throw BadRequestException if RMA is already settled', async () => {
      prisma.rmaRequest.findUnique.mockResolvedValueOnce({
        id: 'rma-3',
        status: RmaStatus.SETTLED,
      });

      await expect(
        service.settleRma('rma-3', {
          approvedRefundAmountBdt: 1850,
          refundChannel: RefundChannel.ORIGINAL_PAYMENT_METHOD,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRmaProgress', () => {
    it('should return RMA ticket with real-time deadline status', async () => {
      const mockRma = {
        id: 'rma-4',
        rmaNumber: 'RMA-202610-A9F1B2',
        status: RmaStatus.SUBMITTED,
        regulatoryRefundDeadlineAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        items: [],
        order: mockOrder,
      };
      prisma.rmaRequest.findFirst.mockResolvedValueOnce(mockRma);

      const result = await service.getRmaProgress('RMA-202610-A9F1B2');

      expect(result.rmaNumber).toBe('RMA-202610-A9F1B2');
      expect(result.deadlineStatus).toBeDefined();
      expect(result.deadlineStatus.isBreached).toBe(false);
    });
  });
});
