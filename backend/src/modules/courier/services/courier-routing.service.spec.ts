import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourierRoutingService } from './courier-routing.service';
import { PathaoService } from './pathao.service';
import { SteadfastService } from './steadfast.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { CourierPartner } from '../dto/smart-dispatch.dto';

describe('CourierRoutingService', () => {
  let router: CourierRoutingService;
  let prisma: any;
  let pathaoService: any;
  let steadfastService: any;

  const mockOrder = {
    id: 'ord-123',
    orderNumber: 'SYV-202610-A9F1B2',
    codDueBdt: 1250,
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(mockOrder),
      },
      orderAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    pathaoService = {
      bookConsignment: jest.fn().mockResolvedValue({
        type: 'success',
        data: { consignment_id: 'DB1029384', order_status: 'Pending' },
      }),
    };

    steadfastService = {
      bookConsignment: jest.fn().mockResolvedValue({
        status: 200,
        message: 'Order created',
        consignment: {
          consignment_id: 9876543,
          tracking_code: 'SF9876543',
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourierRoutingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PathaoService, useValue: pathaoService },
        { provide: SteadfastService, useValue: steadfastService },
      ],
    }).compile();

    router = module.get<CourierRoutingService>(CourierRoutingService);
  });

  it('should return routing policy establishing Pathao as first choice and Steadfast as backup', () => {
    const policy = router.getRoutingPolicy();
    expect(policy.primary).toBe(CourierPartner.PATHAO);
    expect(policy.backup).toBe(CourierPartner.STEADFAST);
    expect(policy.description).toContain('Pathao is the primary');
  });

  it('should throw NotFoundException if order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      router.dispatchOrder({ orderId: 'invalid-id' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should dispatch to Pathao as primary first choice by default', async () => {
    const result = await router.dispatchOrder(
      { orderId: 'ord-123' },
      'staff-1',
    );

    expect(result.success).toBe(true);
    expect(result.courier).toBe(CourierPartner.PATHAO);
    expect(result.failover).toBe(false);
    expect(result.consignmentId).toBe('DB1029384');
    expect(pathaoService.bookConsignment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'ord-123' }),
      'staff-1',
    );
    expect(steadfastService.bookConsignment).not.toHaveBeenCalled();
    expect(prisma.orderAuditLog.create).not.toHaveBeenCalled();
  });

  it('should automatically failover to Steadfast if Pathao fails', async () => {
    pathaoService.bookConsignment.mockRejectedValue(
      new Error('Pathao Hub 503 Service Unavailable'),
    );

    const result = await router.dispatchOrder(
      { orderId: 'ord-123' },
      'staff-1',
    );

    expect(result.success).toBe(true);
    expect(result.courier).toBe(CourierPartner.STEADFAST);
    expect(result.failover).toBe(true);
    expect(result.consignmentId).toBe(9876543);
    expect(result.trackingCode).toBe('SF9876543');
    expect(result.primaryError).toContain('Pathao Hub 503');

    // Verify fallback to Steadfast
    expect(steadfastService.bookConsignment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'ord-123' }),
      'staff-1',
    );

    // Verify audit log of failover
    expect(prisma.orderAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'COURIER_FAILOVER',
          reason: expect.stringContaining('Automated failover: Primary courier (Pathao) failed'),
          metadata: expect.objectContaining({
            previousCourier: 'PATHAO',
            newCourier: 'STEADFAST',
            consignmentId: '9876543',
          }),
        }),
      }),
    );
  });

  it('should throw BadRequestException if both Pathao and Steadfast fail', async () => {
    pathaoService.bookConsignment.mockRejectedValue(
      new Error('Pathao Destination Unreachable'),
    );
    steadfastService.bookConsignment.mockRejectedValue(
      new Error('Steadfast API Timeout'),
    );

    await expect(
      router.dispatchOrder({ orderId: 'ord-123' }),
    ).rejects.toThrow(BadRequestException);

    expect(pathaoService.bookConsignment).toHaveBeenCalled();
    expect(steadfastService.bookConsignment).toHaveBeenCalled();
  });

  it('should dispatch directly to Steadfast if operator selects STEADFAST override', async () => {
    const result = await router.dispatchOrder({
      orderId: 'ord-123',
      preferredCourier: CourierPartner.STEADFAST,
    });

    expect(result.success).toBe(true);
    expect(result.courier).toBe(CourierPartner.STEADFAST);
    expect(result.failover).toBe(false);
    expect(pathaoService.bookConsignment).not.toHaveBeenCalled();
    expect(steadfastService.bookConsignment).toHaveBeenCalled();
  });
});
