import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { QuickTrackingService } from './quick-tracking.service';

describe('QuickTrackingService', () => {
  let service: QuickTrackingService;
  let prisma: any;

  const mockOrder = {
    id: 'ord-uuid-1',
    orderNumber: 'SYV-202610-001',
    guestPhone: '+8801712345678',
    guestName: 'Kazi Nazrul',
    shippingAddress: {
      fullName: 'Kazi Nazrul',
      division: 'Dhaka',
      district: 'Dhaka',
      thanaArea: 'Dhanmondi',
      streetAddress: 'House 42, Road 7A, Dhanmondi R/A, Dhaka',
    },
    subtotalBdt: '2500.00',
    deliveryFeeBdt: '70.00',
    discountBdt: '0.00',
    vatBdt: '125.00',
    totalPayableBdt: '2695.00',
    advancePaidBdt: '200.00',
    codDueBdt: '2495.00',
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PARTIALLY_PAID,
    courierBookingId: 'STEADFAST-109923',
    trackingCode: 'SF-TRK-9901',
    createdAt: new Date('2026-10-15T10:00:00Z'),
    updatedAt: new Date('2026-10-15T12:00:00Z'),
    items: [
      {
        id: 'item-1',
        title: 'Centella Calming Toner',
        quantity: 2,
        unitPriceBdt: '1250.00',
        lineTotalBdt: '2500.00',
      },
    ],
    user: {
      phone: '+8801712345678',
      fullName: 'Kazi Nazrul',
    },
    paymentTransactions: [
      {
        gateway: 'BKASH',
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue(mockOrder),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickTrackingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QuickTrackingService>(QuickTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully track order and return milestones and masked address', async () => {
    const result = await service.quickTrackOrder(
      'SYV-202610-001',
      '01712345678',
    );

    expect(result.orderNumber).toBe('SYV-202610-001');
    expect(result.status).toBe(OrderStatus.SHIPPED);
    expect(result.statusLabel).toBe('Out for Delivery');
    expect(result.statusLabelBn).toBe('Out for Delivery');
    expect(result.courierName).toBe('Steadfast Courier');
    expect(result.courierBookingId).toBe('STEADFAST-109923');
    expect(result.trackingCode).toBe('SF-TRK-9901');
    expect(result.trackingUrl).toContain('steadfast.com.bd/t/SF-TRK-9901');
    expect(result.itemCount).toBe(2);
    expect(result.totalPayableBdt).toBe(2695);
    expect(result.advancePaidBdt).toBe(200);
    expect(result.codDueBdt).toBe(2495);
    expect(result.paymentGateway).toBe('BKASH');

    // Verify address masking
    expect(result.shippingAddressMasked.streetAddressMasked).toContain('***');
    expect(result.shippingAddressMasked.streetAddressMasked).not.toBe(
      'House 42, Road 7A, Dhanmondi R/A, Dhaka',
    );

    // Verify milestones progression
    expect(result.milestones).toHaveLength(6);
    const placedMilestone = result.milestones.find((m) => m.step === 'PLACED');
    expect(placedMilestone?.isCompleted).toBe(true);
    const shippedMilestone = result.milestones.find((m) => m.step === 'SHIPPED');
    expect(shippedMilestone?.isCompleted).toBe(true);
    expect(shippedMilestone?.isCurrent).toBe(true);
    const deliveredMilestone = result.milestones.find(
      (m) => m.step === 'DELIVERED',
    );
    expect(deliveredMilestone?.isCompleted).toBe(false);
  });

  it('should throw NotFoundException if no order matches credentials', async () => {
    prisma.order.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.quickTrackOrder('NONEXISTENT-ORDER', '01899999999'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should resolve Pathao tracking URL when courierBookingId indicates Pathao', async () => {
    prisma.order.findFirst.mockResolvedValueOnce({
      ...mockOrder,
      courierBookingId: 'PTH-CONS-8822',
      trackingCode: 'PTH-CONS-8822',
    });

    const result = await service.quickTrackOrder(
      'SYV-202610-001',
      '+8801712345678',
    );

    expect(result.courierName).toBe('Pathao Courier');
    expect(result.trackingUrl).toContain('merchant.pathao.com/tracking');
  });

  it('should resolve RedX tracking URL when courierBookingId indicates RedX', async () => {
    prisma.order.findFirst.mockResolvedValueOnce({
      ...mockOrder,
      courierBookingId: 'REDX-998822',
      trackingCode: 'REDX-998822',
    });

    const result = await service.quickTrackOrder(
      'SYV-202610-001',
      '+8801712345678',
    );

    expect(result.courierName).toBe('RedX Logistics');
    expect(result.trackingUrl).toContain('redx.com.bd/track');
  });
});
