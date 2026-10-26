import {
  HygieneInspectionOutcome,
  RefundChannel,
  RmaReason,
  RmaStatus,
} from '@prisma/client';

export interface HygieneEvaluationResult {
  isEligible: boolean;
  suggestedOutcome: HygieneInspectionOutcome;
  canRestock: boolean;
  rejectionReason?: string;
}

export interface RmaDeadlineStatus {
  regulatoryRefundDeadline: string;
  isBreached: boolean;
  remainingHours: number;
  statusDescription: string;
}

export interface RmaSettlementResult {
  rmaNumber: string;
  orderNumber: string;
  status: RmaStatus;
  approvedRefundAmountBdt: number;
  refundChannel: RefundChannel;
  refundTrxId: string;
  mushakCreditNoteSerial: string;
  settledAt: string;
  isRestocked: boolean;
}
