import { Test, TestingModule } from '@nestjs/testing';
import { RefundDisbursementService } from './refund-disbursement.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { RefundChannel, RmaStatus } from '@prisma/client';

describe('RefundDisbursementService', () => {
  let service: RefundDisbursementService;
  let prisma: any;
  let outbox: jest.Mocked<OutboxPublisher>;

  const mockRma = {
    id: 'rma-uuid-1',
    rmaNumber: 'RMA-202610-A9F1B2',
    primaryReason: 'TRANSIT_DAMAGE',
    customerName: 'Ayesha Rahman',
    customerPhone: '01712345678',
    isRestockable: false,
    order: {
      id: 'order-uuid-1',
      orderNumber: 'SYV-202610-001',
      subtotalBdt: 3000,
      vatBdt: 450,
      totalPayableBdt: 3450,
      guestName: 'Ayesha Rahman',
      guestPhone: '01712345678',
      status: 'DELIVERED',
    },
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => {
        const tx = {
          mushakInvoice: {
            findUnique: jest.fn().mockResolvedValue({ id: 'msk-inv-1' }),
            create: jest.fn().mockResolvedValue({ id: 'msk-inv-1' }),
          },
          mushakCreditNote: {
            create: jest.fn().mockResolvedValue({
              id: 'crn-1',
              creditNoteSerialNo: 'CRN-SYV-202610-A1B2C3',
            }),
          },
          rmaRequest: {
            update: jest.fn().mockResolvedValue({ id: 'rma-uuid-1', status: RmaStatus.SETTLED }),
          },
          orderAuditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        };
        return cb(tx);
      }),
    };

    const mockOutbox = {
      publish: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundDisbursementService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxPublisher, useValue: mockOutbox },
      ],
    }).compile();

    service = module.get<RefundDisbursementService>(RefundDisbursementService);
    outbox = module.get(OutboxPublisher);
  });

  describe('disburseAndIssueCreditNote', () => {
    it('should disburse refund, generate Mushak-6.7 Credit Note, and record audit trail', async () => {
      const result = await service.disburseAndIssueCreditNote(
        mockRma,
        1850,
        RefundChannel.ORIGINAL_PAYMENT_METHOD,
        'staff-123',
        'RFD_BKASH_12345',
      );

      expect(result.status).toBe(RmaStatus.SETTLED);
      expect(result.approvedRefundAmountBdt).toBe(1850);
      expect(result.refundChannel).toBe(RefundChannel.ORIGINAL_PAYMENT_METHOD);
      expect(result.refundTrxId).toBe('RFD_BKASH_12345');
      expect(result.mushakCreditNoteSerial).toMatch(/^CRN-SYV-/);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(outbox.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateType: 'RmaRequest',
          eventType: 'RmaRefundSettled',
        }),
        expect.anything(),
      );
    });
  });
});
