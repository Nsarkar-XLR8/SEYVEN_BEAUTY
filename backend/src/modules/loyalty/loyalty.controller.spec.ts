import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { TokenService } from '../auth/services/token.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: any;

  const mockTokenService = {
    verifyAccessToken: jest.fn().mockResolvedValue({
      sub: 'usr-loyalty-1',
      phone: '+8801700000000',
      role: UserRole.CUSTOMER,
      jti: 'jti-1',
    }),
  };

  beforeEach(async () => {
    service = {
      getBalance: jest.fn().mockResolvedValue({
        pointsBalance: 400,
        monetaryValueBdt: 40,
        currentTier: 'SILVER',
      }),
      redeemPoints: jest.fn().mockResolvedValue({
        success: true,
        pointsRedeemed: 100,
        discountAmountBdt: 10,
        remainingPointsBalance: 300,
        adjustedCartTotalBdt: 990,
      }),
      getTierStatus: jest.fn().mockResolvedValue({
        currentTier: 'SILVER',
        nextTier: 'GOLD',
        progressPercent: 35,
      }),
      getReplenishmentPredictions: jest.fn().mockResolvedValue({
        total: 5,
        predictions: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        { provide: LoyaltyService, useValue: service },
        { provide: TokenService, useValue: mockTokenService },
        Reflector,
      ],
    }).compile();

    controller = module.get<LoyaltyController>(LoyaltyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return authenticated user loyalty balance and perks', async () => {
      const mockReq = { user: { id: 'usr-loyalty-1' } } as any;
      const res = await controller.getBalance(mockReq);

      expect(service.getBalance).toHaveBeenCalledWith('usr-loyalty-1');
      expect(res.pointsBalance).toBe(400);
      expect(res.monetaryValueBdt).toBe(40);
    });
  });

  describe('redeemPoints', () => {
    it('should process points redemption for cart discount', async () => {
      const mockReq = { user: { id: 'usr-loyalty-1' } } as any;
      const dto = { pointsToRedeem: 100, cartTotalBdt: 1000 };

      const res = await controller.redeemPoints(mockReq, dto);

      expect(service.redeemPoints).toHaveBeenCalledWith('usr-loyalty-1', dto);
      expect(res.success).toBe(true);
      expect(res.pointsRedeemed).toBe(100);
      expect(res.discountAmountBdt).toBe(10);
    });
  });

  describe('getTierStatus', () => {
    it('should return user tier progression and thresholds', async () => {
      const mockReq = { user: { id: 'usr-loyalty-1' } } as any;
      const res = await controller.getTierStatus(mockReq);

      expect(service.getTierStatus).toHaveBeenCalledWith('usr-loyalty-1');
      expect(res.currentTier).toBe('SILVER');
      expect(res.nextTier).toBe('GOLD');
    });
  });

  describe('getReplenishmentPredictions', () => {
    it('should return reorder triggers for staff/admin', async () => {
      const query = { dueWithinDays: 14, limit: 20 };
      const res = await controller.getReplenishmentPredictions(query);

      expect(service.getReplenishmentPredictions).toHaveBeenCalledWith(query);
      expect(res.total).toBe(5);
    });
  });
});
