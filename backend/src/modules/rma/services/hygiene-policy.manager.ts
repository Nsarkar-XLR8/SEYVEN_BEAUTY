import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HygieneInspectionOutcome, RmaReason } from '@prisma/client';
import { HygieneEvaluationResult } from '../interfaces/rma.interface';

@Injectable()
export class HygienePolicyManager {
  private readonly logger = new Logger(HygienePolicyManager.name);

  // Maximum allowed return window in days from order delivery
  public static readonly MAXIMUM_RETURN_WINDOW_DAYS = 7;

  /**
   * Evaluates cosmetic hygiene rules for an inspected RMA item or request.
   */
  evaluateHygieneRules(
    reason: RmaReason,
    isSealIntact: boolean,
    photoEvidenceUrls: string[] = [],
    deliveredAt?: Date | null,
  ): HygieneEvaluationResult {
    // 1. Statutory Return Window Check
    if (deliveredAt) {
      const daysSinceDelivery =
        (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > HygienePolicyManager.MAXIMUM_RETURN_WINDOW_DAYS) {
        return {
          isEligible: false,
          suggestedOutcome: HygieneInspectionOutcome.REJECTED_OUTSIDE_WINDOW,
          canRestock: false,
          rejectionReason: `Request exceeds the statutory ${HygienePolicyManager.MAXIMUM_RETURN_WINDOW_DAYS}-day post-delivery return window under Bangladesh Digital Commerce Guidelines.`,
        };
      }
    }

    // 2. Mandatory Evidence Check for Defect/Damage/Reaction
    const requiresEvidence = (
      [
        RmaReason.TRANSIT_DAMAGE,
        RmaReason.DEFECTIVE_PRODUCT,
        RmaReason.ADVERSE_DERMAL_REACTION,
      ] as RmaReason[]
    ).includes(reason);

    if (requiresEvidence && (!photoEvidenceUrls || photoEvidenceUrls.length === 0)) {
      return {
        isEligible: false,
        suggestedOutcome: HygieneInspectionOutcome.REJECTED_EVIDENCE_INSUFFICIENT,
        canRestock: false,
        rejectionReason: 'Mandatory photo/video evidence substantiating physical defect or damage was not provided.',
      };
    }

    // 3. Strict Cosmetic Hygiene Check for Change of Mind / Unopened Returns
    if (reason === RmaReason.UNOPENED_MIND_CHANGE) {
      if (!isSealIntact) {
        return {
          isEligible: false,
          suggestedOutcome: HygieneInspectionOutcome.REJECTED_HYGIENE_UNSEALED,
          canRestock: false,
          rejectionReason:
            'Strict Cosmetic Hygiene Policy Violation: Under DGDA and sanitary regulations, skincare serums, essences, and emulsions with broken or tampered seals cannot be accepted for return or refund due to cross-contamination and microbial safety hazards.',
        };
      }
      return {
        isEligible: true,
        suggestedOutcome: HygieneInspectionOutcome.PASSED_SEALED,
        canRestock: true,
      };
    }

    // 4. Transit Damage & Factory Defects
    if (reason === RmaReason.TRANSIT_DAMAGE || reason === RmaReason.DEFECTIVE_PRODUCT) {
      return {
        isEligible: true,
        suggestedOutcome: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
        canRestock: false, // Damaged/defective items must be quarantined/destroyed, never restocked
      };
    }

    // 5. Wrong Item Delivered
    if (reason === RmaReason.WRONG_ITEM_DELIVERED) {
      return {
        isEligible: true,
        suggestedOutcome: isSealIntact
          ? HygieneInspectionOutcome.PASSED_SEALED
          : HygieneInspectionOutcome.PASSED_VALID_DEFECT,
        canRestock: isSealIntact,
      };
    }

    // 6. Adverse Dermal Reaction
    if (reason === RmaReason.ADVERSE_DERMAL_REACTION) {
      return {
        isEligible: true,
        suggestedOutcome: HygieneInspectionOutcome.PASSED_ADVERSE_REACTION,
        canRestock: false,
      };
    }

    return {
      isEligible: isSealIntact,
      suggestedOutcome: isSealIntact
        ? HygieneInspectionOutcome.PASSED_SEALED
        : HygieneInspectionOutcome.REJECTED_HYGIENE_UNSEALED,
      canRestock: isSealIntact,
      rejectionReason: !isSealIntact ? 'Cosmetic hygiene seal compromised.' : undefined,
    };
  }
}
