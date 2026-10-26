import { PaymentStateMachine } from './payment-state-machine';
import { PaymentStatus } from '../interfaces/payment.interface';
import { BadRequestException } from '@nestjs/common';

describe('PaymentStateMachine', () => {
  describe('canTransition', () => {
    it('should allow PENDING to transitions to AUTHORIZED, PARTIALLY_PAID, PAID, FAILED', () => {
      expect(PaymentStateMachine.canTransition(PaymentStatus.PENDING, PaymentStatus.AUTHORIZED)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PENDING, PaymentStatus.PAID)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
    });

    it('should allow PARTIALLY_PAID to PAID and REFUNDED', () => {
      expect(PaymentStateMachine.canTransition(PaymentStatus.PARTIALLY_PAID, PaymentStatus.PAID)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PARTIALLY_PAID, PaymentStatus.REFUNDED)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PARTIALLY_PAID, PaymentStatus.PARTIALLY_REFUNDED)).toBe(true);
    });

    it('should allow PAID to REFUNDED and PARTIALLY_REFUNDED', () => {
      expect(PaymentStateMachine.canTransition(PaymentStatus.PAID, PaymentStatus.REFUNDED)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED)).toBe(true);
    });

    it('should disallow illegal backwards transitions', () => {
      expect(PaymentStateMachine.canTransition(PaymentStatus.PAID, PaymentStatus.PENDING)).toBe(false);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PAID, PaymentStatus.AUTHORIZED)).toBe(false);
      expect(PaymentStateMachine.canTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID)).toBe(false);
    });

    it('should allow idempotent self-transitions', () => {
      expect(PaymentStateMachine.canTransition(PaymentStatus.PAID, PaymentStatus.PAID)).toBe(true);
      expect(PaymentStateMachine.canTransition(PaymentStatus.PENDING, PaymentStatus.PENDING)).toBe(true);
    });
  });

  describe('assertCanTransition', () => {
    it('should throw BadRequestException on illegal transitions', () => {
      expect(() => {
        PaymentStateMachine.assertCanTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID);
      }).toThrow(BadRequestException);
    });

    it('should pass without error on valid transition', () => {
      expect(() => {
        PaymentStateMachine.assertCanTransition(PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID);
      }).not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should accurately identify terminal state', () => {
      expect(PaymentStateMachine.isTerminal(PaymentStatus.REFUNDED)).toBe(true);
      expect(PaymentStateMachine.isTerminal(PaymentStatus.PAID)).toBe(false);
    });

    it('should accurately identify settled state', () => {
      expect(PaymentStateMachine.isSettled(PaymentStatus.PAID)).toBe(true);
      expect(PaymentStateMachine.isSettled(PaymentStatus.PARTIALLY_PAID)).toBe(false);
    });
  });
});
