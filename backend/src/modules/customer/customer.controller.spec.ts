import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, UserRole } from '@prisma/client';
import { TokenService } from '../auth/services/token.service';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  let controller: CustomerController;
  let service: any;

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'usr-auth-123',
      phone: '+8801711223344',
      role: UserRole.CUSTOMER,
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    service = {
      quickTrack: jest.fn().mockResolvedValue({
        orderNumber: 'SYV-202610-001',
        status: OrderStatus.SHIPPED,
        statusLabel: 'Shipped',
        totalPayableBdt: 2500,
      }),
      getProfile: jest.fn().mockResolvedValue({
        user: { id: 'usr-auth-123', fullName: 'Shakib Al Hasan' },
        savedAddresses: [],
        loyalty: { isRepeatClient: true, privilegeDiscountPercent: 5 },
      }),
      manageAddresses: jest.fn().mockResolvedValue({
        success: true,
        count: 1,
        addresses: [{ id: 'addr-1', thanaArea: 'Banani' }],
      }),
      getCustomer360: jest.fn().mockResolvedValue({
        overview: { id: 'usr-target-456' },
        financialMetrics: { lifetimeValueBdt: 7500 },
      }),
      exportPersonalData: jest.fn().mockResolvedValue({
        legalEntity: 'SEYVEN Bangladesh Limited',
        dataSubject: { id: 'usr-auth-123' },
      }),
      executeRightToErasure: jest.fn().mockResolvedValue({
        success: true,
        message: 'Account successfully anonymized.',
        anonymizedId: 'usr-auth-123',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        { provide: CustomerService, useValue: service },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('quickTrack', () => {
    it('should return public instant tracking info', async () => {
      const res = await controller.quickTrack({
        orderNumber: 'SYV-202610-001',
        phone: '01711223344',
      });

      expect(service.quickTrack).toHaveBeenCalledWith({
        orderNumber: 'SYV-202610-001',
        phone: '01711223344',
      });
      expect(res.orderNumber).toBe('SYV-202610-001');
      expect(res.status).toBe(OrderStatus.SHIPPED);
    });
  });

  describe('getProfile', () => {
    it('should return authenticated user profile', async () => {
      const mockReq = { user: { id: 'usr-auth-123' } } as any;
      const res = await controller.getProfile(mockReq);

      expect(service.getProfile).toHaveBeenCalledWith('usr-auth-123');
      expect(res.user.id).toBe('usr-auth-123');
    });
  });

  describe('manageAddresses', () => {
    it('should update customer address book', async () => {
      const mockReq = { user: { id: 'usr-auth-123' } } as any;
      const dto = {
        addresses: [
          {
            division: 'Dhaka',
            district: 'Dhaka',
            thanaArea: 'Banani',
            streetAddress: 'Road 11',
            isDefault: true,
          },
        ],
      };

      const res = await controller.manageAddresses(mockReq, dto);

      expect(service.manageAddresses).toHaveBeenCalledWith(
        'usr-auth-123',
        dto,
      );
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
    });
  });

  describe('getCustomer360', () => {
    it('should return 360 intelligence dossier for admin/staff', async () => {
      const res = await controller.getCustomer360('550e8400-e29b-41d4-a716-446655440000');

      expect(service.getCustomer360).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(res.overview.id).toBe('usr-target-456');
      expect(res.financialMetrics.lifetimeValueBdt).toBe(7500);
    });
  });

  describe('exportPersonalData', () => {
    it('should trigger GDPR data portability export', async () => {
      const mockReq = { user: { id: 'usr-auth-123' } } as any;
      const res = await controller.exportPersonalData(mockReq);

      expect(service.exportPersonalData).toHaveBeenCalledWith('usr-auth-123');
      expect(res.legalEntity).toBe('SEYVEN Bangladesh Limited');
    });
  });

  describe('executeRightToErasure', () => {
    it('should trigger right-to-erasure account anonymization', async () => {
      const mockReq = {
        user: { id: 'usr-auth-123' },
        ip: '103.20.1.2',
        headers: { 'user-agent': 'Chrome Browser' },
      } as any;
      const dto = {
        confirmationText: 'DELETE_MY_ACCOUNT',
      };

      const res = await controller.executeRightToErasure(mockReq, dto);

      expect(service.executeRightToErasure).toHaveBeenCalledWith(
        'usr-auth-123',
        dto,
        '103.20.1.2',
        'Chrome Browser',
      );
      expect(res.success).toBe(true);
      expect(res.anonymizedId).toBe('usr-auth-123');
    });
  });
});
