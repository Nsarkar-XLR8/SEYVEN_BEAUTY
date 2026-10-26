import { Injectable } from '@nestjs/common';
import { RmaDeadlineStatus } from '../interfaces/rma.interface';

@Injectable()
export class RegulatoryDeadlineManager {
  // Regulatory deadline for e-commerce refund settlement in Bangladesh (7 calendar days)
  public static readonly REGULATORY_REFUND_DAYS = 7;

  /**
   * Computes statutory refund deadline from submission timestamp.
   */
  calculateDeadline(submittedAt: Date): Date {
    const deadline = new Date(submittedAt.getTime());
    deadline.setDate(deadline.getDate() + RegulatoryDeadlineManager.REGULATORY_REFUND_DAYS);
    return deadline;
  }

  /**
   * Checks whether the regulatory deadline has been breached.
   */
  isDeadlineBreached(deadline: Date, settledAt?: Date | null): boolean {
    if (settledAt) {
      return settledAt.getTime() > deadline.getTime();
    }
    return Date.now() > deadline.getTime();
  }

  /**
   * Evaluates the current SLA timeline and remaining hours.
   */
  getDeadlineStatus(deadline: Date, settledAt?: Date | null): RmaDeadlineStatus {
    const now = Date.now();
    const deadlineTime = deadline.getTime();
    const isBreached = settledAt ? settledAt.getTime() > deadlineTime : now > deadlineTime;

    const diffMs = deadlineTime - (settledAt ? settledAt.getTime() : now);
    const remainingHours = Math.round(diffMs / (1000 * 60 * 60));

    let statusDescription = 'Within Regulatory SLA';
    if (settledAt) {
      statusDescription = isBreached
        ? 'Settled post-deadline breach'
        : 'Settled within regulatory compliance window';
    } else if (isBreached) {
      statusDescription = `Regulatory SLA breached by ${Math.abs(remainingHours)} hour(s)`;
    } else {
      statusDescription = `${remainingHours} hour(s) remaining until statutory refund deadline`;
    }

    return {
      regulatoryRefundDeadline: deadline.toISOString(),
      isBreached,
      remainingHours: Math.max(0, remainingHours),
      statusDescription,
    };
  }
}
