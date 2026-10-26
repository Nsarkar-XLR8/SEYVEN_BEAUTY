import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { OrdersController } from './orders.controller';
import { OrdersService } from './services/orders.service';
import { TokenService } from '../auth/services/token.service';
import { DispatchDocsService } from './services/dispatch-docs.service';
import { ManifestExportFormat } from './dto/export-manifest.dto';
import {
  CallVerificationOutcome,
  OrderSource,
  OrderStatus,
  UserRole,
} from '@prisma/client';

import { RtoReturnsService } from './services/rto-returns.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: any;
  let dispatchDocsService: any;
  let rtoReturnsService: any;

  const mockUser = {
    userId: 'staff-user-1',
    phone: '+8801712345678',
    role: UserRole.SUPPORT_AGENT,
  };

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'staff-user-1',
      phone: '+8801712345678',
      role: UserRole.SUPPORT_AGENT,
      jti: 'jti-1',
    }),
  };

  const createMockResponse = () => {
    const res: any = {};
    res.set = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    service = {
      listOrders: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getOrderById: jest.fn().mockResolvedValue({ id: 'ord-1', orderNumber: 'SYV-1' }),
      createManualOrder: jest.fn().mockResolvedValue({ id: 'ord-1', orderNumber: 'SYV-1' }),
      updateOrderStatus: jest.fn().mockResolvedValue({ id: 'ord-1', status: OrderStatus.CONFIRMED }),
      logCallVerification: jest.fn().mockResolvedValue({ orderId: 'ord-1', currentStatus: OrderStatus.CONFIRMED }),
    };

    dispatchDocsService = {
      generateShippingLabelPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-label')),
      generateMushak63Pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-mushak')),
      generateManifestPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-manifest')),
      generateManifestCsv: jest.fn().mockResolvedValue('SL,Order Number\n1,SYV-1'),
      generatePackingSlipPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-packingslip')),
    };

    rtoReturnsService = {
      processPartialDelivery: jest.fn().mockResolvedValue({
        success: true,
        orderId: 'ord-1',
        status: OrderStatus.PARTIALLY_DELIVERED,
      }),
      processRto: jest.fn().mockResolvedValue({
        success: true,
        orderId: 'ord-1',
        status: OrderStatus.RETURNED,
      }),
      generateMushak67Pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-mushak67')),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: service },
        { provide: DispatchDocsService, useValue: dispatchDocsService },
        { provide: RtoReturnsService, useValue: rtoReturnsService },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should delegate listOrders to service', async () => {
    const query = { page: 1, limit: 20 };
    await controller.listOrders(query as any, mockUser);
    expect(service.listOrders).toHaveBeenCalledWith(query, mockUser);
  });

  it('should delegate getOrderById to service', async () => {
    await controller.getOrderById('ord-1', mockUser);
    expect(service.getOrderById).toHaveBeenCalledWith('ord-1', mockUser);
  });

  it('should delegate createManualOrder to service', async () => {
    const dto = {
      customerPhone: '01712345678',
      customerName: 'Tasnim',
      source: OrderSource.MESSENGER,
      shippingAddress: {} as any,
      items: [],
    };
    await controller.createManualOrder(dto as any, mockUser);
    expect(service.createManualOrder).toHaveBeenCalledWith(dto, mockUser.userId);
  });

  it('should delegate updateOrderStatus to service', async () => {
    const dto = { status: OrderStatus.PACKED, reason: 'Picked and packed in warehouse' };
    await controller.updateOrderStatus('ord-1', dto, mockUser);
    expect(service.updateOrderStatus).toHaveBeenCalledWith('ord-1', dto, mockUser.userId);
  });

  it('should delegate logCallVerification to service', async () => {
    const dto = { callOutcome: CallVerificationOutcome.CONFIRMED, notes: 'Confirmed' };
    await controller.logCallVerification('ord-1', dto, mockUser);
    expect(service.logCallVerification).toHaveBeenCalledWith('ord-1', dto, mockUser.userId);
  });

  // Phase 20 Documentation Tests
  it('GET /admin/orders/:id/label should stream 4x6 thermal shipping label PDF', async () => {
    const res = createMockResponse();
    await controller.getShippingLabel('ord-1', res);
    expect(dispatchDocsService.generateShippingLabelPdf).toHaveBeenCalledWith('ord-1');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('GET /admin/orders/:id/mushak-6.3 should stream NBR Mushak-6.3 tax invoice PDF', async () => {
    const res = createMockResponse();
    await controller.getMushak63Invoice('ord-1', res);
    expect(dispatchDocsService.generateMushak63Pdf).toHaveBeenCalledWith('ord-1');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('GET /admin/manifests/export should stream Courier Handover Manifest PDF', async () => {
    const res = createMockResponse();
    const query = { courier: undefined, format: ManifestExportFormat.PDF };
    await controller.exportManifest(query as any, res);
    expect(dispatchDocsService.generateManifestPdf).toHaveBeenCalledWith(query);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('GET /admin/manifests/export should send CSV when format=csv', async () => {
    const res = createMockResponse();
    const query = { courier: undefined, format: ManifestExportFormat.CSV };
    await controller.exportManifest(query as any, res);
    expect(dispatchDocsService.generateManifestCsv).toHaveBeenCalledWith(query);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'text/csv; charset=utf-8' }),
    );
    expect(res.send).toHaveBeenCalledWith('SL,Order Number\n1,SYV-1');
  });

  it('GET /admin/orders/:id/packing-slip should stream Warehouse Picking Slip PDF', async () => {
    const res = createMockResponse();
    await controller.getPackingSlip('ord-1', res);
    expect(dispatchDocsService.generatePackingSlipPdf).toHaveBeenCalledWith('ord-1');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalled();
  });

  // Phase 21 Partial Delivery, RTO Ledger, and Mushak-6.7 Tests
  it('POST /admin/orders/:id/partial-delivery should delegate to rtoReturnsService', async () => {
    const dto = {
      acceptedItems: [{ orderItemId: 'item-1', acceptedQuantity: 1 }],
      reason: 'Customer rejected second shade',
    };
    const result = await controller.processPartialDelivery('ord-1', dto as any, mockUser);
    expect(rtoReturnsService.processPartialDelivery).toHaveBeenCalledWith('ord-1', dto, mockUser.userId);
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: OrderStatus.PARTIALLY_DELIVERED }),
    );
  });

  it('POST /admin/orders/:id/rto should delegate to rtoReturnsService', async () => {
    const dto = {
      courierName: 'PATHAO',
      forwardShippingCostBdt: 120,
      returnShippingCostBdt: 60,
      reason: 'Customer unreachable after 3 attempts',
    };
    const result = await controller.processRto('ord-1', dto as any, mockUser);
    expect(rtoReturnsService.processRto).toHaveBeenCalledWith('ord-1', dto, mockUser.userId);
    expect(result).toEqual(
      expect.objectContaining({ success: true, status: OrderStatus.RETURNED }),
    );
  });

  it('GET /admin/orders/:id/mushak-6.7 should stream NBR Mushak-6.7 Credit Note PDF', async () => {
    const res = createMockResponse();
    await controller.getMushak67CreditNote('ord-1', res);
    expect(rtoReturnsService.generateMushak67Pdf).toHaveBeenCalledWith('ord-1');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.end).toHaveBeenCalled();
  });
});

