import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, RmaReason, RmaStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { GdprService } from './gdpr.service';

describe('GdprService', () => {
  let service: GdprService;
  let prisma: any;

  const mockUser = {
    id: 'user-gdpr-1',
    phone: '+8801811223344',
    email: 'nusrat@example.com',
    fullName: 'Nusrat Jahan',
    createdAt: new Date('2025-06-01T00:00:00Z'),
    addresses: [
      {
        id: 'addr-1',
        division: 'Dhaka',
        district: 'Dhaka',
        thanaArea: 'Gulshan-2',
        courierZoneId: 1,
        streetAddress: 'House 12, Road 45, Gulshan-2',
        landmark: 'Near Pink City',
        isDefault: true,
        createdAt: new Date('2025-06-01T00:00:00Z'),
      },
    ],
    orders: [
      {
        id: 'ord-gdpr-1',
        orderNumber: 'SYV-202610-099',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        totalPayableBdt: '4500.00',
        createdAt: new Date('2026-07-01T00:00:00Z'),
        mushakInvoice: {
          mushakSerialNo: 'MUS-6.3-2026-099',
        },
        paymentTransactions: [{ gateway: 'SSLCOMMERZ' }],
        items: [
          {
            sku: 'SKU-TONER-01',
            title: 'Centella Toner',
            quantity: 1,
            unitPriceBdt: '1500.00',
            lineTotalBdt: '1500.00',
          },
        ],
      },
    ],
    rmaRequests: [
      {
        id: 'rma-1',
        rmaNumber: 'RMA-2026-088',
        status: RmaStatus.APPROVED,
        primaryReason: RmaReason.DEFECTIVE_PRODUCT,
        requestedAmountBdt: '1500.00',
        approvedRefundAmountBdt: '1500.00',
        createdAt: new Date('2026-07-05T00:00:00Z'),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue({ ...mockUser, fullName: 'Anonymized Customer' }),
      },
      userAddress: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      customerDermalProfile: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userConsentLog: {
        create: jest.fn().mockResolvedValue({ id: 'c-erasure-1' }),
      },
      notificationLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GdprService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<GdprService>(GdprService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should export complete personal data archive', async () => {
    const archive = await service.exportPersonalData('user-gdpr-1');

    expect(archive.legalEntity).toBe('SEYVEN Bangladesh Limited');
    expect(archive.dataSubject.fullName).toBe('Nusrat Jahan');
    expect(archive.savedAddresses).toHaveLength(1);
    expect(archive.orders).toHaveLength(1);
    expect(archive.orders[0].mushakSixThreeNumber).toBe('MUS-6.3-2026-099');
    expect(archive.orders[0].paymentGateway).toBe('SSLCOMMERZ');
    expect(archive.rmaRequests).toHaveLength(1);
  });

  it('should throw NotFoundException if exporting data for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.exportPersonalData('unknown-user')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should reject right-to-erasure with BadRequestException if confirmation passphrase is wrong', async () => {
    await expect(
      service.executeRightToErasure('user-gdpr-1', {
        confirmationText: 'PLEASE_DELETE',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully execute right-to-erasure and anonymize customer PII', async () => {
    const result = await service.executeRightToErasure(
      'user-gdpr-1',
      { confirmationText: 'DELETE_MY_ACCOUNT' },
      '103.25.12.1',
      'Mozilla/5.0 Chrome',
    );

    expect(result.success).toBe(true);
    expect(result.anonymizedId).toBe('user-gdpr-1');
    expect(result.message).toContain('Mushak-6.3 fiscal tax invoice');

    // Verify user record anonymization call
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-gdpr-1' },
        data: expect.objectContaining({
          fullName: 'Anonymized Customer',
          email: null,
          isPhoneVerified: false,
        }),
      }),
    );

    // Verify addresses redacted
    expect(prisma.userAddress.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-gdpr-1' },
        data: expect.objectContaining({
          streetAddress: expect.stringContaining('REDACTED'),
        }),
      }),
    );
  });
});
