import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '../interfaces/payment.interface';

export class PaymentStateMachine {
  /**
   * Allowed state transitions map for payment lifecycle.
   */
  private static readonly ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.AUTHORIZED,
      PaymentStatus.PARTIALLY_PAID,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
    ],
    [PaymentStatus.AUTHORIZED]: [
      PaymentStatus.PARTIALLY_PAID,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ],
    [PaymentStatus.PARTIALLY_PAID]: [
      PaymentStatus.PAID,
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.REFUNDED,
      PaymentStatus.FAILED,
    ],
    [PaymentStatus.PAID]: [
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.REFUNDED,
    ],
    [PaymentStatus.FAILED]: [
      PaymentStatus.PENDING, // Allow retry if payment failed
    ],
    [PaymentStatus.PARTIALLY_REFUNDED]: [
      PaymentStatus.REFUNDED,
    ],
    [PaymentStatus.REFUNDED]: [], // Terminal state
  };

  /**
   * Checks if a transition from current status to next status is permitted.
   */
  public static canTransition(current: PaymentStatus, next: PaymentStatus): boolean {
    if (current === next) {
      return true; // Idempotent no-op
    }
    const allowed = this.ALLOWED_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  /**
   * Asserts that transition is valid, or throws BadRequestException.
   */
  public static assertCanTransition(current: PaymentStatus, next: PaymentStatus): void {
    if (!this.canTransition(current, next)) {
      throw new BadRequestException(
        `Illegal payment state transition from '${current}' to '${next}'.`,
      );
    }
  }

  /**
   * Identifies terminal payment states.
   */
  public static isTerminal(status: PaymentStatus): boolean {
    return status === PaymentStatus.REFUNDED;
  }

  /**
   * Identifies if payment is fully settled.
   */
  public static isSettled(status: PaymentStatus): boolean {
    return status === PaymentStatus.PAID;
  }
}
