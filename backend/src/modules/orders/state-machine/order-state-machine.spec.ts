import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrderStateMachine } from './order-state-machine';

describe('OrderStateMachine', () => {
  describe('canTransition', () => {
    it('should allow valid sequential forward progression', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PLACED, OrderStatus.CONFIRMED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.PACKED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.PACKED, OrderStatus.BOOKED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.BOOKED, OrderStatus.SHIPPED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.PARTIALLY_DELIVERED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.SHIPPED, OrderStatus.RETURNED)).toBe(true);
    });

    it('should allow cancellation before dispatch', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PLACED, OrderStatus.CANCELLED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.PACKED, OrderStatus.CANCELLED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.BOOKED, OrderStatus.CANCELLED)).toBe(true);
    });

    it('should disallow skipping critical states or arbitrary jumping', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PLACED, OrderStatus.SHIPPED)).toBe(false);
      expect(OrderStateMachine.canTransition(OrderStatus.PLACED, OrderStatus.DELIVERED)).toBe(false);
      expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)).toBe(false);
    });

    it('should treat identical status transition as valid/idempotent', () => {
      expect(OrderStateMachine.canTransition(OrderStatus.PLACED, OrderStatus.PLACED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.CONFIRMED, OrderStatus.CONFIRMED)).toBe(true);
      expect(OrderStateMachine.canTransition(OrderStatus.DELIVERED, OrderStatus.DELIVERED)).toBe(true);
    });
  });

  describe('validateTransition', () => {
    it('should succeed silently on valid forward transition', () => {
      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.PLACED, OrderStatus.CONFIRMED),
      ).not.toThrow();

      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.BOOKED, OrderStatus.SHIPPED),
      ).not.toThrow();
    });

    it('should allow idempotent identical state transitions without throwing', () => {
      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.SHIPPED, OrderStatus.SHIPPED),
      ).not.toThrow();
    });

    it('should throw BadRequestException on backward monotonic status regression (out-of-order webhook)', () => {
      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.SHIPPED, OrderStatus.BOOKED),
      ).toThrow(BadRequestException);

      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.SHIPPED, OrderStatus.CONFIRMED),
      ).toThrow(/Monotonic transition violation/);

      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.BOOKED, OrderStatus.PLACED),
      ).toThrow(/Monotonic transition violation/);
    });

    it('should throw BadRequestException when attempting to transition out of terminal state', () => {
      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.DELIVERED, OrderStatus.SHIPPED),
      ).toThrow(/terminal state/i);

      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.CANCELLED, OrderStatus.PLACED),
      ).toThrow(/terminal state/i);

      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.RETURNED, OrderStatus.DELIVERED),
      ).toThrow(/terminal state/i);
    });

    it('should throw BadRequestException on illegal transitions', () => {
      expect(() =>
        OrderStateMachine.validateTransition(OrderStatus.PLACED, OrderStatus.DELIVERED),
      ).toThrow(/Invalid status transition/);
    });
  });

  describe('isTerminal and getAllowedNextStates', () => {
    it('should identify terminal states accurately', () => {
      expect(OrderStateMachine.isTerminal(OrderStatus.DELIVERED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.CANCELLED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.PARTIALLY_DELIVERED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.RETURNED)).toBe(true);
      expect(OrderStateMachine.isTerminal(OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED)).toBe(true);

      expect(OrderStateMachine.isTerminal(OrderStatus.PLACED)).toBe(false);
      expect(OrderStateMachine.isTerminal(OrderStatus.CONFIRMED)).toBe(false);
      expect(OrderStateMachine.isTerminal(OrderStatus.SHIPPED)).toBe(false);
    });

    it('should return next allowed states list', () => {
      expect(OrderStateMachine.getAllowedNextStates(OrderStatus.PLACED)).toEqual([
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
      ]);
      expect(OrderStateMachine.getAllowedNextStates(OrderStatus.DELIVERED)).toEqual([]);
    });
  });
});
