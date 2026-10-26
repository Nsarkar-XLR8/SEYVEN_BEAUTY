import { HygienePolicyManager } from './hygiene-policy.manager';
import { HygieneInspectionOutcome, RmaReason } from '@prisma/client';

describe('HygienePolicyManager', () => {
  let manager: HygienePolicyManager;

  beforeEach(() => {
    manager = new HygienePolicyManager();
  });

  describe('evaluateHygieneRules', () => {
    it('should reject requests outside the statutory 7-day return window', () => {
      const deliveryDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const result = manager.evaluateHygieneRules(
        RmaReason.UNOPENED_MIND_CHANGE,
        true,
        ['https://storage.seyven.com/evidence.jpg'],
        deliveryDate,
      );

      expect(result.isEligible).toBe(false);
      expect(result.suggestedOutcome).toBe(HygieneInspectionOutcome.REJECTED_OUTSIDE_WINDOW);
      expect(result.canRestock).toBe(false);
      expect(result.rejectionReason).toContain('exceeds the statutory 7-day');
    });

    it('should require photo/video evidence for damage and defect claims', () => {
      const result = manager.evaluateHygieneRules(
        RmaReason.TRANSIT_DAMAGE,
        false,
        [], // Empty evidence
        new Date(),
      );

      expect(result.isEligible).toBe(false);
      expect(result.suggestedOutcome).toBe(
        HygieneInspectionOutcome.REJECTED_EVIDENCE_INSUFFICIENT,
      );
      expect(result.rejectionReason).toContain('Mandatory photo/video evidence');
    });

    it('should STRICTLY reject unsealed change-of-mind cosmetic returns under hygiene policy', () => {
      const result = manager.evaluateHygieneRules(
        RmaReason.UNOPENED_MIND_CHANGE,
        false, // Seal compromised / broken
        ['https://storage.seyven.com/opened-bottle.jpg'],
        new Date(),
      );

      expect(result.isEligible).toBe(false);
      expect(result.suggestedOutcome).toBe(
        HygieneInspectionOutcome.REJECTED_HYGIENE_UNSEALED,
      );
      expect(result.canRestock).toBe(false);
      expect(result.rejectionReason).toContain('Strict Cosmetic Hygiene Policy Violation');
    });

    it('should approve unopened change-of-mind returns with intact seal and mark restockable', () => {
      const result = manager.evaluateHygieneRules(
        RmaReason.UNOPENED_MIND_CHANGE,
        true, // Seal intact
        ['https://storage.seyven.com/sealed-box.jpg'],
        new Date(),
      );

      expect(result.isEligible).toBe(true);
      expect(result.suggestedOutcome).toBe(HygieneInspectionOutcome.PASSED_SEALED);
      expect(result.canRestock).toBe(true);
    });

    it('should approve valid transit damage with photos even if seal broken, but forbid restocking', () => {
      const result = manager.evaluateHygieneRules(
        RmaReason.TRANSIT_DAMAGE,
        false, // Seal broken during transit accident
        ['https://storage.seyven.com/cracked-bottle.jpg'],
        new Date(),
      );

      expect(result.isEligible).toBe(true);
      expect(result.suggestedOutcome).toBe(HygieneInspectionOutcome.PASSED_VALID_DEFECT);
      expect(result.canRestock).toBe(false); // Damaged cosmetics must never be restocked
    });

    it('should approve adverse dermal reaction claims with photo documentation', () => {
      const result = manager.evaluateHygieneRules(
        RmaReason.ADVERSE_DERMAL_REACTION,
        false, // Product used
        ['https://storage.seyven.com/reaction-erythema.jpg'],
        new Date(),
      );

      expect(result.isEligible).toBe(true);
      expect(result.suggestedOutcome).toBe(
        HygieneInspectionOutcome.PASSED_ADVERSE_REACTION,
      );
      expect(result.canRestock).toBe(false);
    });
  });
});
