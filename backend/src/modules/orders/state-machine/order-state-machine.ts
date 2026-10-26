import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export class OrderStateMachine {
  /**
   * Allowed state transitions map enforcing standard e-commerce lifecycle
   */
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PLACED]: [
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED,
      OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
    ],
    [OrderStatus.CONFIRMED]: [
      OrderStatus.PACKED,
      OrderStatus.BOOKED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PACKED]: [
      OrderStatus.BOOKED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.BOOKED]: [
      OrderStatus.SHIPPED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
    ],
    [OrderStatus.SHIPPED]: [
      OrderStatus.DELIVERED,
      OrderStatus.PARTIALLY_DELIVERED,
      OrderStatus.RETURNED,
    ],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.PARTIALLY_DELIVERED]: [],
    [OrderStatus.RETURNED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED]: [],
  };

  /**
   * Monotonic sequence ranking preventing backward status updates or regression from out-of-order webhooks
   */
  private static readonly STATUS_RANKS: Record<OrderStatus, number> = {
    [OrderStatus.PLACED]: 10,
    [OrderStatus.CONFIRMED]: 20,
    [OrderStatus.PACKED]: 30,
    [OrderStatus.BOOKED]: 40,
    [OrderStatus.SHIPPED]: 50,
    [OrderStatus.DELIVERED]: 60,
    [OrderStatus.PARTIALLY_DELIVERED]: 60,
    [OrderStatus.RETURNED]: 60,
    [OrderStatus.CANCELLED]: 99,
    [OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED]: 99,
  };

  /**
   * Terminal states where no further transitions are permissible
   */
  private static readonly TERMINAL_STATES: Set<OrderStatus> = new Set([
    OrderStatus.DELIVERED,
    OrderStatus.PARTIALLY_DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.CANCELLED,
    OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
  ]);

  /**
   * Verify if a transition from `current` to `next` is valid according to business rules
   */
  public static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    if (current === next) {
      return true;
    }
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Get all allowed forward transitions from the given state
   */
  public static getAllowedNextStates(current: OrderStatus): OrderStatus[] {
    return this.ALLOWED_TRANSITIONS[current] || [];
  }

  /**
   * Check if current status is a terminal state
   */
  public static isTerminal(status: OrderStatus): boolean {
    return this.TERMINAL_STATES.has(status);
  }

  /**
   * Strictly validate the transition and throw descriptive BadRequestException if invalid or out-of-order
   */
  public static validateTransition(current: OrderStatus, next: OrderStatus): void {
    // 1. Idempotent call
    if (current === next) {
      return;
    }

    // 2. Terminal state guard
    if (this.isTerminal(current)) {
      throw new BadRequestException(
        `Cannot transition order from terminal state '${current}' to '${next}'. Terminal orders are immutable.`,
      );
    }

    // 3. Monotonic downgrade guard (prevents out-of-order webhook regression)
    const currentRank = this.STATUS_RANKS[current] ?? 0;
    const nextRank = this.STATUS_RANKS[next] ?? 0;

    // A cancellation can happen from pre-shipped states (PLACED, CONFIRMED, PACKED, BOOKED)
    // Non-cancellation transitions must strictly move forward in sequence
    if (next !== OrderStatus.CANCELLED && next !== OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED) {
      if (nextRank <= currentRank) {
        throw new BadRequestException(
          `Monotonic transition violation: Cannot regress order status backwards from '${current}' (rank ${currentRank}) to '${next}' (rank ${nextRank}). Out-of-order webhook update rejected.`,
        );
      }
    }

    // 4. State transition table check
    const allowedTransitions = this.ALLOWED_TRANSITIONS[current] || [];
    if (!allowedTransitions.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from '${current}' to '${next}'. Allowed next statuses: [${allowedTransitions.join(', ')}]`,
      );
    }
  }
}
