import { Test, TestingModule } from '@nestjs/testing';
import { TierCalculatorService } from './tier-calculator.service';

describe('TierCalculatorService', () => {
  let service: TierCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TierCalculatorService],
    }).compile();

    service = module.get<TierCalculatorService>(TierCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTier', () => {
    it('should assign BRONZE for < 1000 points', () => {
      expect(service.calculateTier(0)).toBe('BRONZE');
      expect(service.calculateTier(999)).toBe('BRONZE');
    });

    it('should assign SILVER for 1000 - 4999 points', () => {
      expect(service.calculateTier(1000)).toBe('SILVER');
      expect(service.calculateTier(4999)).toBe('SILVER');
    });

    it('should assign GOLD for 5000 - 14999 points', () => {
      expect(service.calculateTier(5000)).toBe('GOLD');
      expect(service.calculateTier(14999)).toBe('GOLD');
    });

    it('should assign NOIR for 15000+ points', () => {
      expect(service.calculateTier(15000)).toBe('NOIR');
      expect(service.calculateTier(50000)).toBe('NOIR');
    });
  });

  describe('getTierPerks', () => {
    it('should return correct multiplier and perks for BRONZE', () => {
      const perks = service.getTierPerks('BRONZE');
      expect(perks.pointsMultiplier).toBe(1.0);
      expect(perks.freeShippingMinimumSpendBdt).toBe(1500);
      expect(perks.priorityDispatch).toBe(false);
    });

    it('should return correct multiplier and perks for SILVER', () => {
      const perks = service.getTierPerks('SILVER');
      expect(perks.pointsMultiplier).toBe(1.25);
      expect(perks.freeShippingMinimumSpendBdt).toBe(1000);
      expect(perks.priorityDispatch).toBe(true);
    });

    it('should return correct multiplier and perks for GOLD', () => {
      const perks = service.getTierPerks('GOLD');
      expect(perks.pointsMultiplier).toBe(1.5);
      expect(perks.freeShippingMinimumSpendBdt).toBe(500);
    });

    it('should return correct multiplier and perks for NOIR', () => {
      const perks = service.getTierPerks('NOIR');
      expect(perks.pointsMultiplier).toBe(2.0);
      expect(perks.freeShippingMinimumSpendBdt).toBeNull(); // 100% free shipping
    });
  });

  describe('calculateNextTierProgress', () => {
    it('should calculate progress from BRONZE to SILVER correctly', () => {
      const progress = service.calculateNextTierProgress(400);

      expect(progress.currentTier).toBe('BRONZE');
      expect(progress.nextTier).toBe('SILVER');
      expect(progress.pointsNeededForNextTier).toBe(600);
      expect(progress.progressPercent).toBe(40);
      expect(progress.tiersProgression).toHaveLength(4);
    });

    it('should calculate progress from SILVER to GOLD correctly', () => {
      const progress = service.calculateNextTierProgress(3000);

      expect(progress.currentTier).toBe('SILVER');
      expect(progress.nextTier).toBe('GOLD');
      expect(progress.pointsNeededForNextTier).toBe(2000);
      // Span is 5000 - 1000 = 4000. Points in tier is 3000 - 1000 = 2000. 2000/4000 = 50%
      expect(progress.progressPercent).toBe(50);
    });

    it('should handle highest NOIR tier with 100% progress and no next tier', () => {
      const progress = service.calculateNextTierProgress(20000);

      expect(progress.currentTier).toBe('NOIR');
      expect(progress.nextTier).toBeNull();
      expect(progress.pointsNeededForNextTier).toBe(0);
      expect(progress.progressPercent).toBe(100);
    });
  });

  describe('calculatePointsEarned', () => {
    it('should calculate points with tier multiplier', () => {
      // 1000 BDT spend: Base = 100 points
      expect(service.calculatePointsEarned(1000, 'BRONZE')).toBe(100); // 100 * 1.0
      expect(service.calculatePointsEarned(1000, 'SILVER')).toBe(125); // 100 * 1.25
      expect(service.calculatePointsEarned(1000, 'GOLD')).toBe(150); // 100 * 1.5
      expect(service.calculatePointsEarned(1000, 'NOIR')).toBe(200); // 100 * 2.0
    });

    it('should return 0 for zero or negative spend', () => {
      expect(service.calculatePointsEarned(0, 'BRONZE')).toBe(0);
      expect(service.calculatePointsEarned(-500, 'GOLD')).toBe(0);
    });
  });

  describe('calculateMonetaryValueBdt', () => {
    it('should convert points to BDT at 10 points = 1 BDT rate', () => {
      expect(service.calculateMonetaryValueBdt(200)).toBe(20);
      expect(service.calculateMonetaryValueBdt(1050)).toBe(105);
      expect(service.calculateMonetaryValueBdt(0)).toBe(0);
    });
  });
});
