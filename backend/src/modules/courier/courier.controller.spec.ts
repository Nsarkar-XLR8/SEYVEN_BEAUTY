import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CourierController } from './courier.controller';
import { PathaoService } from './services/pathao.service';
import { SteadfastService } from './services/steadfast.service';
import { TokenService } from '../auth/services/token.service';
import { UserRole } from '@prisma/client';

import { CourierRoutingService } from './services/courier-routing.service';
import { CourierPartner } from './dto/smart-dispatch.dto';

describe('CourierController', () => {
  let controller: CourierController;
  let pathaoService: any;
  let steadfastService: any;
  let courierRoutingService: any;

  const mockUser = {
    userId: 'staff-user-1',
    phone: '+8801712345678',
    role: UserRole.FULFILLMENT_OPERATOR,
  };

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'staff-user-1',
      phone: '+8801712345678',
      role: UserRole.FULFILLMENT_OPERATOR,
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    pathaoService = {
      bookConsignment: jest.fn().mockResolvedValue({
        type: 'success',
        data: { consignment_id: 'DB1029384' },
      }),
      handleInboundWebhook: jest.fn().mockResolvedValue({
        acknowledged: true,
        consignmentId: 'DB1029384',
      }),
      getTrackingStatus: jest.fn().mockResolvedValue({
        type: 'success',
        data: { consignment_id: 'DB1029384', order_status: 'In_Transit' },
      }),
      getDlqEntries: jest.fn().mockResolvedValue([]),
    };

    steadfastService = {
      bookConsignment: jest.fn().mockResolvedValue({
        status: 200,
        message: 'Consignment created',
        consignment: { consignment_id: 'SF-1001' },
      }),
      handleInboundWebhook: jest.fn().mockResolvedValue({
        acknowledged: true,
        consignmentId: 'SF-1001',
      }),
      getTrackingStatus: jest.fn().mockResolvedValue({
        status: 200,
        delivery_status: 'in_transit',
      }),
      getDlqEntries: jest.fn().mockResolvedValue([]),
    };

    courierRoutingService = {
      dispatchOrder: jest.fn().mockResolvedValue({
        success: true,
        courier: CourierPartner.PATHAO,
        failover: false,
        consignmentId: 'DB1029384',
      }),
      getRoutingPolicy: jest.fn().mockReturnValue({
        primary: CourierPartner.PATHAO,
        backup: CourierPartner.STEADFAST,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourierController],
      providers: [
        { provide: PathaoService, useValue: pathaoService },
        { provide: SteadfastService, useValue: steadfastService },
        { provide: CourierRoutingService, useValue: courierRoutingService },
        { provide: TokenService, useValue: mockTokenService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock_courier_secret'),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<CourierController>(CourierController);
  });

  // Steadfast Tests
  it('POST /courier/steadfast/book should call steadfastService.bookConsignment', async () => {
    const dto = { orderId: 'ord-123' };
    await controller.bookSteadfastConsignment(dto, mockUser);
    expect(steadfastService.bookConsignment).toHaveBeenCalledWith(dto, mockUser.userId);
  });

  it('POST /webhooks/courier/steadfast should call steadfastService.handleInboundWebhook', async () => {
    const dto = {
      consignment_id: 'SF-1001',
      invoice: 'SYV-1',
      status: 'delivered',
    };
    await controller.handleSteadfastWebhook(dto);
    expect(steadfastService.handleInboundWebhook).toHaveBeenCalledWith(dto);
  });

  it('GET /courier/steadfast/tracking/:id should call steadfastService.getTrackingStatus', async () => {
    await controller.getSteadfastTrackingStatus('SF-1001');
    expect(steadfastService.getTrackingStatus).toHaveBeenCalledWith('SF-1001');
  });

  it('GET /admin/courier/steadfast/dlq should call steadfastService.getDlqEntries', async () => {
    await controller.getSteadfastDlqEntries(25);
    expect(steadfastService.getDlqEntries).toHaveBeenCalledWith(25);
  });

  // Pathao Tests
  it('POST /courier/pathao/book should call pathaoService.bookConsignment', async () => {
    const dto = { orderId: 'ord-123' };
    await controller.bookConsignment(dto, mockUser);
    expect(pathaoService.bookConsignment).toHaveBeenCalledWith(dto, mockUser.userId);
  });

  it('POST /webhooks/courier/pathao should call pathaoService.handleInboundWebhook', async () => {
    const dto = {
      consignment_id: 'DB1029384',
      merchant_order_id: 'SYV-1',
      order_status: 'Delivered',
    };
    await controller.handlePathaoWebhook(dto);
    expect(pathaoService.handleInboundWebhook).toHaveBeenCalledWith(dto);
  });

  it('GET /courier/pathao/tracking/:id should call pathaoService.getTrackingStatus', async () => {
    await controller.getTrackingStatus('DB1029384');
    expect(pathaoService.getTrackingStatus).toHaveBeenCalledWith('DB1029384');
  });

  it('GET /admin/courier/pathao/dlq should call pathaoService.getDlqEntries', async () => {
    await controller.getDlqEntries(20);
    expect(pathaoService.getDlqEntries).toHaveBeenCalledWith(20);
  });

  // Dynamic Routing Tests (Pathao 1st, Steadfast Backup)
  it('POST /courier/dispatch should call courierRoutingService.dispatchOrder', async () => {
    const dto = { orderId: 'ord-123' };
    const result = await controller.smartDispatch(dto, mockUser);
    expect(courierRoutingService.dispatchOrder).toHaveBeenCalledWith(dto, mockUser.userId);
    expect(result.courier).toBe(CourierPartner.PATHAO);
  });

  it('GET /courier/routing/policy should return routing policy hierarchy', () => {
    const policy = controller.getRoutingPolicy();
    expect(courierRoutingService.getRoutingPolicy).toHaveBeenCalled();
    expect(policy.primary).toBe(CourierPartner.PATHAO);
    expect(policy.backup).toBe(CourierPartner.STEADFAST);
  });
});


