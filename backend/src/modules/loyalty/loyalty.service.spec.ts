import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { LoyaltyTransactionType } from './interfaces/loyalty.interface';
import { LoyaltyService } from './loyalty.service';
import { ReplenishmentEngineService } from './services/replenishment-engine.service';
import { TierCalculatorService } from './services/tier-calculator.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: any;
  let tierCalculator: any;
  let replenishmentEngine: any;

  const mockAccount = {
    id: 'acc-loyalty-1',
    userId: 'usr-loyalty-1',
    pointsBalance: 500,
    lifetimePoints: 1200,
    tier: 'SILVER',
  };

  const mockTransactions = [
    {
      id: 'tx-1',
      type: LoyaltyTransactionType.EARNED_PURCHASE,
      points: 125,
      runningBalance: 500,
      description: 'Earned 125 points from order',
      orderId: 'ord-1',
      createdAt: new Date('2026-10-01T00:00:00Z'),
    },
  ];

  beforeEach(async () => {
    prisma = {
      loyaltyAccount: {
        findUnique: jest.fn().mockResolvedValue(mockAccount),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'acc-new', ...data })),
        update: jest.fn().mockResolvedValue(mockAccount),
      },
      loyaltyTransaction: {
        findMany: jest.fn().mockResolvedValue(mockTransactions),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tx-new', ...data })),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ord-100',
          orderNumber: 'SYV-202610-100',
          userId: 'usr-loyalty-1',
          totalPayableBdt: '2000.00',
          status: OrderStatus.DELIVERED,
        }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    tierCalculator = {
      getTierPerks: jest.fn().mockReturnValue({
        tier: 'SILVER',
        pointsMultiplier: 1.25,
        freeShippingMinimumSpendBdt: 1000,
      }),
      calculateMonetaryValueBdt: jest.fn().mockImplementation((pts) => pts / 10),
      calculateTier: jest.fn().mockReturnValue('SILVER'),
      calculateNextTierProgress: jest.fn().mockReturnValue({
        currentTier: 'SILVER',
        nextTier: 'GOLD',
        progressPercent: 20,
      }),
      calculatePointsEarned: jest.fn().mockReturnValue(250),
    };

    replenishmentEngine = {
      getReplenishmentPredictions: jest.fn().mockResolvedValue({
        total: 1,
        predictions: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: prisma },
        { provide: TierCalculatorService, useValue: tierCalculator },
        { provide: ReplenishmentEngineService, useValue: replenishmentEngine },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return points balance, cash value, tier perks, and ledger history', async () => {
      const res = await service.getBalance('usr-loyalty-1');

      expect(res.pointsBalance).toBe(500);
      expect(res.monetaryValueBdt).toBe(50); // 500 / 10
      expect(res.currentTier).toBe('SILVER');
      expect(res.tierPerks.pointsMultiplier).toBe(1.25);
      expect(res.recentTransactions).toHaveLength(1);
    });
  });

  describe('getTierStatus', () => {
    it('should return tier progression status', async () => {
      const res = await service.getTierStatus('usr-loyalty-1');
      expect(tierCalculator.calculateNextTierProgress).toHaveBeenCalledWith(1200);
      expect(res.currentTier).toBe('SILVER');
    });
  });

  describe('redeemPoints', () => {
    it('should successfully redeem points within 30% cart limit', async () => {
      const result = await service.redeemPoints('usr-loyalty-1', {
        pointsToRedeem: 200,
        cartTotalBdt: 2000, // 30% limit is 600 BDT. 200 points = 20 BDT <= 600 BDT
      });

      expect(result.success).toBe(true);
      expect(result.pointsRedeemed).toBe(200);
      expect(result.discountAmountBdt).toBe(20);
      expect(result.remainingPointsBalance).toBe(300); // 500 - 200
      expect(result.adjustedCartTotalBdt).toBe(1980);

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { pointsBalance: 300 },
        }),
      );
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: LoyaltyTransactionType.REDEEMED_CHECKOUT,
            points: -200,
            runningBalance: 300,
          }),
        }),
      );
    });

    it('should throw BadRequestException if points to redeem exceed available balance', async () => {
      await expect(
        service.redeemPoints('usr-loyalty-1', {
          pointsToRedeem: 1000, // Balance is 500
          cartTotalBdt: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if discount exceeds 30% cart total threshold', async () => {
      // 500 points = 50 BDT. If cart total is 100 BDT, 30% limit is 30 BDT => should reject
      await expect(
        service.redeemPoints('usr-loyalty-1', {
          pointsToRedeem: 500,
          cartTotalBdt: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('earnPointsForOrder', () => {
    it('should award points and update lifetime points on delivered order', async () => {
      tierCalculator.calculatePointsEarned.mockReturnValueOnce(250);
      tierCalculator.calculateTier.mockReturnValueOnce('SILVER');

      const tx = await service.earnPointsForOrder('ord-100');

      expect(tierCalculator.calculatePointsEarned).toHaveBeenCalledWith(
        2000,
        'SILVER',
      );
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            pointsBalance: 750, // 500 + 250
            lifetimePoints: 1450, // 1200 + 250
            tier: 'SILVER',
          },
        }),
      );
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'ord-100',
            type: LoyaltyTransactionType.EARNED_PURCHASE,
            points: 250,
            runningBalance: 750,
          }),
        }),
      );
    });

    it('should skip duplicate earn calls if order was already processed', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValueOnce({
        id: 'existing-tx',
        orderId: 'ord-100',
      });

      const tx = await service.earnPointsForOrder('ord-100');
      expect(tx?.id).toBe('existing-tx');
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });
  });

  describe('clawbackPointsForReturn', () => {
    it('should claw back points proportionally on RMA return', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValueOnce({
        id: 'tx-earn',
        points: 200,
      });

      await service.clawbackPointsForReturn('ord-100', 1000); // 1000 of 2000 refund => 50% => 100 points

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { pointsBalance: 400 }, // 500 - 100
        }),
      );
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: LoyaltyTransactionType.CLAWBACK_RETURN,
            points: -100,
            runningBalance: 400,
          }),
        }),
      );
    });
  });

  describe('getReplenishmentPredictions', () => {
    it('should delegate to replenishmentEngine', async () => {
      const query = { dueWithinDays: 14, limit: 10 };
      await service.getReplenishmentPredictions(query);
      expect(replenishmentEngine.getReplenishmentPredictions).toHaveBeenCalledWith(
        query,
      );
    });
  });
});
