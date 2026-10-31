import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, RmaReason, RmaStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { GeoZoneService } from '../checkout/services/geo-zone.service';
import { CustomerService } from './customer.service';
import { Customer360Service } from './services/customer-360.service';
import { GdprService } from './services/gdpr.service';
import { QuickTrackingService } from './services/quick-tracking.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: any;
  let geoZoneService: any;
  let quickTrackingService: any;
  let customer360Service: any;
  let gdprService: any;

  const mockUser = {
    id: 'user-srv-1',
    phone: '+8801700000000',
    email: 'user@example.com',
    fullName: 'Anisur Rahman',
    role: UserRole.CUSTOMER,
    isPhoneVerified: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    loyaltyAccount: {
      pointsBalance: 150,
      lifetimePoints: 600,
      tier: 'SILVER',
    },
    addresses: [
      {
        id: 'addr-1',
        division: 'Dhaka',
        district: 'Dhaka',
        thanaArea: 'Banani',
        courierZoneId: 1,
        streetAddress: 'House 5, Road 11, Banani',
        landmark: null,
        isDefault: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ],
  };

  const mockOrders = [
    {
      id: 'ord-1',
      orderNumber: 'SYV-202610-101',
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      totalPayableBdt: '1800.00',
      trackingCode: 'SF-1001',
      createdAt: new Date('2026-10-10T00:00:00Z'),
    },
    {
      id: 'ord-2',
      orderNumber: 'SYV-202610-102',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      totalPayableBdt: '2500.00',
      trackingCode: 'SF-1002',
      createdAt: new Date('2026-09-01T00:00:00Z'),
    },
  ];

  const mockRmas = [
    {
      id: 'rma-1',
      rmaNumber: 'RMA-2026-111',
      status: RmaStatus.SUBMITTED,
      primaryReason: RmaReason.DEFECTIVE_PRODUCT,
      requestedAmountBdt: '1800.00',
      approvedRefundAmountBdt: null,
      createdAt: new Date('2026-10-11T00:00:00Z'),
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
      rmaRequest: {
        findMany: jest.fn().mockResolvedValue(mockRmas),
      },
      userAddress: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'addr-new', ...data })),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'addr-new-1',
            userId: 'user-srv-1',
            division: 'Dhaka',
            district: 'Dhaka',
            thanaArea: 'Mirpur-10',
            courierZoneId: 1,
            streetAddress: 'House 1, Road 2, Mirpur-10',
            landmark: null,
            isDefault: true,
            createdAt: new Date(),
          },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    geoZoneService = {
      resolveCourierZone: jest.fn().mockReturnValue({
        courierZoneId: 1,
        zoneName: 'Inside Dhaka Metropolitan',
        baseFee: 70,
      }),
    };

    quickTrackingService = {
      quickTrackOrder: jest.fn().mockResolvedValue({
        orderNumber: 'SYV-202610-101',
        status: OrderStatus.SHIPPED,
      }),
    };

    customer360Service = {
      getCustomer360: jest.fn().mockResolvedValue({
        overview: { id: 'user-srv-1' },
      }),
    };

    gdprService = {
      exportPersonalData: jest.fn().mockResolvedValue({
        legalEntity: 'SEYVEN Bangladesh Limited',
      }),
      executeRightToErasure: jest.fn().mockResolvedValue({
        success: true,
        anonymizedId: 'user-srv-1',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: prisma },
        { provide: GeoZoneService, useValue: geoZoneService },
        { provide: QuickTrackingService, useValue: quickTrackingService },
        { provide: Customer360Service, useValue: customer360Service },
        { provide: GdprService, useValue: gdprService },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return complete customer profile summary', async () => {
      const profile = await service.getProfile('user-srv-1');

      expect(profile.user.id).toBe('user-srv-1');
      expect(profile.user.phone).toBe('+8801700000000');
      expect(profile.loyalty.isRepeatClient).toBe(true);
      expect(profile.loyalty.privilegeDiscountPercent).toBe(5);
      expect(profile.savedAddresses).toHaveLength(1);
      expect(profile.ordersSummary.totalOrdersCount).toBe(2);
      expect(profile.ordersSummary.activeOrdersCount).toBe(1); // ord-1 (SHIPPED)
      expect(profile.ordersSummary.deliveredOrdersCount).toBe(1); // ord-2 (DELIVERED)
      expect(profile.activeRmaTickets).toHaveLength(1);
      expect(profile.activeRmaTickets[0].rmaNumber).toBe('RMA-2026-111');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('manageAddresses', () => {
    it('should auto-resolve courierZoneId and persist addresses', async () => {
      const result = await service.manageAddresses('user-srv-1', {
        addresses: [
          {
            division: 'Dhaka',
            district: 'Dhaka',
            thanaArea: 'Mirpur-10',
            streetAddress: 'House 1, Road 2, Mirpur-10',
            isDefault: true,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(geoZoneService.resolveCourierZone).toHaveBeenCalledWith(
        'Dhaka',
        'Dhaka',
        'Mirpur-10',
      );
      expect(prisma.userAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-srv-1',
            courierZoneId: 1,
            isDefault: true,
          }),
        }),
      );
    });

    it('should throw NotFoundException if customer does not exist when updating addresses', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.manageAddresses('non-existent', {
          addresses: [
            {
              division: 'Dhaka',
              district: 'Dhaka',
              thanaArea: 'Dhanmondi',
              streetAddress: 'Road 27',
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delegates', () => {
    it('should delegate quickTrack to quickTrackingService', async () => {
      const res = await service.quickTrack({
        orderNumber: 'SYV-202610-101',
        phone: '01700000000',
      });
      expect(quickTrackingService.quickTrackOrder).toHaveBeenCalledWith(
        'SYV-202610-101',
        '01700000000',
      );
      expect(res.orderNumber).toBe('SYV-202610-101');
    });

    it('should delegate getCustomer360 to customer360Service', async () => {
      const res = await service.getCustomer360('user-srv-1');
      expect(customer360Service.getCustomer360).toHaveBeenCalledWith(
        'user-srv-1',
      );
      expect(res.overview.id).toBe('user-srv-1');
    });

    it('should delegate exportPersonalData to gdprService', async () => {
      const res = await service.exportPersonalData('user-srv-1');
      expect(gdprService.exportPersonalData).toHaveBeenCalledWith('user-srv-1');
      expect(res.legalEntity).toBe('SEYVEN Bangladesh Limited');
    });

    it('should delegate executeRightToErasure to gdprService', async () => {
      const res = await service.executeRightToErasure(
        'user-srv-1',
        { confirmationText: 'DELETE_MY_ACCOUNT' },
        '103.25.1.1',
        'Portal Agent',
      );
      expect(gdprService.executeRightToErasure).toHaveBeenCalledWith(
        'user-srv-1',
        { confirmationText: 'DELETE_MY_ACCOUNT' },
        '103.25.1.1',
        'Portal Agent',
      );
      expect(res.success).toBe(true);
    });
  });
});
