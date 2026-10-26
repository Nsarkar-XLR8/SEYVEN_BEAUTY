import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RmaController } from './rma.controller';
import { RmaService } from './rma.service';
import { TokenService } from '../auth/services/token.service';
import { CreateRmaRequestDto } from './dto/create-rma.dto';
import { InspectRmaDto } from './dto/inspect-rma.dto';
import { SettleRmaDto } from './dto/settle-rma.dto';
import {
  HygieneInspectionOutcome,
  RefundChannel,
  RmaReason,
  RmaStatus,
  UserRole,
} from '@prisma/client';

describe('RmaController', () => {
  let controller: RmaController;
  let service: any;

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'staff-user-1',
      phone: '+8801712345678',
      role: UserRole.SUPER_ADMIN,
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    service = {
      submitRmaRequest: jest.fn().mockResolvedValue({
        id: 'rma-1',
        rmaNumber: 'RMA-202610-A9F1B2',
        status: RmaStatus.SUBMITTED,
      }),
      getRmaProgress: jest.fn().mockResolvedValue({
        id: 'rma-1',
        rmaNumber: 'RMA-202610-A9F1B2',
        status: RmaStatus.SUBMITTED,
        deadlineStatus: { isBreached: false, remainingHours: 168 },
      }),
      inspectRma: jest.fn().mockResolvedValue({
        id: 'rma-1',
        status: RmaStatus.APPROVED,
        inspectionOutcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
      }),
      settleRma: jest.fn().mockResolvedValue({
        rmaNumber: 'RMA-202610-A9F1B2',
        status: RmaStatus.SETTLED,
        approvedRefundAmountBdt: 1850,
        mushakCreditNoteSerial: 'CRN-SYV-202610-001',
      }),
      listRmaRequests: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RmaController],
      providers: [
        { provide: RmaService, useValue: service },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<RmaController>(RmaController);
  });

  describe('POST /rma/requests', () => {
    it('should submit customer RMA request', async () => {
      const dto: CreateRmaRequestDto = {
        orderId: 'SYV-202610-A9F1B2',
        customerPhone: '01712345678',
        primaryReason: RmaReason.TRANSIT_DAMAGE,
        reasonDetails: 'Cracked bottle packaging',
        photoEvidenceUrls: ['https://storage.seyven.com/damage.jpg'],
        items: [{ orderItemId: 'item-1', quantity: 1 }],
      };

      const mockReq = { user: { id: 'user-1', role: UserRole.CUSTOMER } } as any;
      const result = await controller.createRmaRequest(dto, mockReq);

      expect(result.rmaNumber).toBe('RMA-202610-A9F1B2');
      expect(service.submitRmaRequest).toHaveBeenCalledWith(
        dto,
        'user-1',
        UserRole.CUSTOMER,
      );
    });
  });

  describe('GET /rma/requests/:id', () => {
    it('should retrieve RMA progress and SLA tracking', async () => {
      const mockReq = { user: { id: 'user-1', role: UserRole.CUSTOMER } } as any;
      const result = await controller.getRmaProgress('RMA-202610-A9F1B2', mockReq);

      expect(result.rmaNumber).toBe('RMA-202610-A9F1B2');
      expect(service.getRmaProgress).toHaveBeenCalledWith(
        'RMA-202610-A9F1B2',
        'user-1',
        UserRole.CUSTOMER,
      );
    });
  });

  describe('PATCH /admin/rma/:id/inspect', () => {
    it('should record hygiene inspection outcome', async () => {
      const dto: InspectRmaDto = {
        outcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
        isSealIntact: false,
        inspectionNotes: 'Damaged in transit verified',
        isRestockable: false,
      };

      const mockReq = { user: { id: 'staff-1', role: UserRole.SUPPORT_AGENT } } as any;
      const result = await controller.inspectRma('rma-1', dto, mockReq);

      expect(result.status).toBe(RmaStatus.APPROVED);
      expect(service.inspectRma).toHaveBeenCalledWith('rma-1', dto, 'staff-1');
    });
  });

  describe('POST /admin/rma/:id/settle', () => {
    it('should settle RMA and disburse refund with credit note', async () => {
      const dto: SettleRmaDto = {
        approvedRefundAmountBdt: 1850,
        refundChannel: RefundChannel.ORIGINAL_PAYMENT_METHOD,
      };

      const mockReq = { user: { id: 'finance-1', role: UserRole.FINANCE_OFFICER } } as any;
      const result = await controller.settleRma('rma-1', dto, mockReq);

      expect(result.status).toBe(RmaStatus.SETTLED);
      expect(result.mushakCreditNoteSerial).toBe('CRN-SYV-202610-001');
      expect(service.settleRma).toHaveBeenCalledWith('rma-1', dto, 'finance-1');
    });
  });

  describe('GET /admin/rma', () => {
    it('should list RMA requests for operations staff', async () => {
      const result = await controller.listRmaRequests({ status: RmaStatus.SUBMITTED });

      expect(result.items).toEqual([]);
      expect(service.listRmaRequests).toHaveBeenCalledWith({ status: RmaStatus.SUBMITTED });
    });
  });
});
