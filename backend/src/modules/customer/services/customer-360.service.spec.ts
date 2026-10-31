import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CallVerificationOutcome,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  RmaReason,
  RmaStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { Customer360Service } from './customer-360.service';

describe('Customer360Service', () => {
  let service: Customer360Service;
  let prisma: any;

  const mockUser = {
    id: 'user-360-1',
    phone: '+8801711223344',
    email: 'tahmid@example.com',
    fullName: 'Tahmid Chowdhury',
    role: UserRole.CUSTOMER,
    isPhoneVerified: true,
    isBlacklisted: false,
    fraudRiskScore: 12,
    createdAt: new Date('2025-01-15T00:00:00Z'),
    loyaltyAccount: {
      pointsBalance: 450,
      lifetimePoints: 1200,
      tier: 'GOLD',
    },
    addresses: [],
  };

  const mockOrders = [
    {
      id: 'ord-1',
      orderNumber: 'SYV-202610-001',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      totalPayableBdt: '3000.00',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      mushakInvoice: {
        mushakSerialNo: 'MUS-6.3-2026-001',
      },
      items: [
        {
          id: 'i-1',
          title: 'Niacinamide 10% Serum',
          quantity: 2,
          unitPriceBdt: '1500.00',
          lineTotalBdt: '3000.00',
        },
      ],
      callVerifications: [
        {
          id: 'call-1',
          callOutcome: CallVerificationOutcome.CONFIRMED,
          notes: 'Customer confirmed order at doorstep',
          calledAt: new Date('2026-09-01T11:00:00Z'),
          nextFollowUpAt: null,
        },
      ],
      rtoExpenses: [],
      rmaRequests: [],
    },
    {
      id: 'ord-2',
      orderNumber: 'SYV-202610-002',
      status: OrderStatus.RETURNED,
      paymentStatus: PaymentStatus.REFUNDED,
      totalPayableBdt: '2000.00',
      createdAt: new Date('2026-09-15T12:00:00Z'),
      mushakInvoice: {
        mushakSerialNo: 'MUS-6.3-2026-002',
      },
      items: [
        {
          id: 'i-2',
          title: 'Salicylic Acid Cleanser',
          quantity: 1,
          unitPriceBdt: '2000.00',
          lineTotalBdt: '2000.00',
        },
      ],
      callVerifications: [],
      rtoExpenses: [
        {
          id: 'rto-1',
          totalLossBdt: '160.00',
          forwardShippingFeeBdt: '80.00',
          returnShippingFeeBdt: '80.00',
        },
      ],
      rmaRequests: [],
    },
    {
      id: 'ord-3',
      orderNumber: 'SYV-202610-003',
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      totalPayableBdt: '1500.00',
      createdAt: new Date('2026-09-20T12:00:00Z'),
      mushakInvoice: null,
      items: [],
      callVerifications: [],
      rtoExpenses: [],
      rmaRequests: [],
    },
  ];

  const mockNotificationLogs = [
    {
      id: 'notif-1',
      channel: NotificationChannel.SMS,
      templateName: 'ORDER_DISPATCH_ALERT',
      status: NotificationStatus.DELIVERED,
      messageBody: 'Your order SYV-202610-001 has been dispatched.',
      sentAt: new Date('2026-09-01T14:00:00Z'),
      createdAt: new Date('2026-09-01T14:00:00Z'),
    },
  ];

  const mockGrievances = [
    {
      id: 'grv-1',
      grievanceTicket: 'GRV-2026-009',
      subject: 'Delay in delivery',
      status: 'RESOLVED',
      slaDeadlineAt: new Date('2026-09-05T00:00:00Z'),
      resolvedAt: new Date('2026-09-04T12:00:00Z'),
      resolutionNotes: 'Courier expedited after contact',
      createdAt: new Date('2026-09-02T10:00:00Z'),
    },
  ];

  const mockRmaRequests = [
    {
      id: 'rma-1',
      rmaNumber: 'RMA-2026-004',
      status: RmaStatus.APPROVED,
      primaryReason: RmaReason.TRANSIT_DAMAGE,
      requestedAmountBdt: '2000.00',
      approvedRefundAmountBdt: '2000.00',
      createdAt: new Date('2026-09-16T10:00:00Z'),
    },
  ];

  const mockConsentLogs = [
    {
      id: 'c-1',
      consentCategory: 'TERMS_AND_CONDITIONS',
      isGranted: true,
      createdAt: new Date('2025-01-15T00:00:00Z'),
    },
  ];

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      order: {
        findMany: jest.fn().mockResolvedValue(mockOrders),
      },
      customerGrievance: {
        findMany: jest.fn().mockResolvedValue(mockGrievances),
      },
      rmaRequest: {
        findMany: jest.fn().mockResolvedValue(mockRmaRequests),
      },
      userConsentLog: {
        findMany: jest.fn().mockResolvedValue(mockConsentLogs),
      },
      notificationLog: {
        findMany: jest.fn().mockResolvedValue(mockNotificationLogs),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Customer360Service,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<Customer360Service>(Customer360Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compile complete customer 360 dossier with metrics and interactions', async () => {
    const dossier = await service.getCustomer360('user-360-1');

    // Overview
    expect(dossier.overview.id).toBe('user-360-1');
    expect(dossier.overview.phone).toBe('+8801711223344');
    expect(dossier.overview.fraudRiskScore).toBe(12);

    // Financial Metrics
    // Non-cancelled orders are ord-1 (3000) and ord-2 (2000) => LTV = 5000
    expect(dossier.financialMetrics.lifetimeValueBdt).toBe(5000);
    // AOV = 5000 / 2 = 2500
    expect(dossier.financialMetrics.averageOrderValueBdt).toBe(2500);
    expect(dossier.financialMetrics.totalOrdersCount).toBe(3);
    expect(dossier.financialMetrics.deliveredOrdersCount).toBe(1);
    expect(dossier.financialMetrics.cancelledOrdersCount).toBe(1);
    expect(dossier.financialMetrics.returnedOrdersCount).toBe(1);
    // Success rate = (1 / 3) * 100 = 33.33%
    expect(dossier.financialMetrics.deliverySuccessRatePercent).toBe(33.33);
    // RTO loss = 160
    expect(dossier.financialMetrics.rtoLossTotalBdt).toBe(160);

    // Loyalty
    expect(dossier.loyaltyStatus.isRepeatClient).toBe(true);
    expect(dossier.loyaltyStatus.privilegeDiscountPercent).toBe(5);

    // Interaction Timeline
    expect(dossier.interactionTimeline.orders).toHaveLength(3);
    expect(dossier.interactionTimeline.smsLogs).toHaveLength(1);
    expect(dossier.interactionTimeline.callVerifications).toHaveLength(1);
    expect(dossier.interactionTimeline.rmaRequests).toHaveLength(1);
  });

  it('should throw NotFoundException if customer does not exist', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.getCustomer360('non-existent-user')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should handle customer with 0 orders cleanly', async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);

    const dossier = await service.getCustomer360('user-360-1');
    expect(dossier.financialMetrics.lifetimeValueBdt).toBe(0);
    expect(dossier.financialMetrics.averageOrderValueBdt).toBe(0);
    expect(dossier.financialMetrics.deliverySuccessRatePercent).toBe(100);
    expect(dossier.financialMetrics.rtoLossTotalBdt).toBe(0);
  });
});
