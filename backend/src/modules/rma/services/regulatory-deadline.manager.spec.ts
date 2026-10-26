import { RegulatoryDeadlineManager } from './regulatory-deadline.manager';

describe('RegulatoryDeadlineManager', () => {
  let manager: RegulatoryDeadlineManager;

  beforeEach(() => {
    manager = new RegulatoryDeadlineManager();
  });

  describe('calculateDeadline', () => {
    it('should add exactly 7 days to submission timestamp', () => {
      const submittedAt = new Date('2026-10-10T10:00:00Z');
      const deadline = manager.calculateDeadline(submittedAt);

      const expected = new Date('2026-10-17T10:00:00Z');
      expect(deadline.toISOString()).toBe(expected.toISOString());
    });
  });

  describe('isDeadlineBreached', () => {
    it('should return false if settled prior to deadline', () => {
      const deadline = new Date('2026-10-17T10:00:00Z');
      const settledAt = new Date('2026-10-15T10:00:00Z');

      expect(manager.isDeadlineBreached(deadline, settledAt)).toBe(false);
    });

    it('should return true if settled after deadline', () => {
      const deadline = new Date('2026-10-17T10:00:00Z');
      const settledAt = new Date('2026-10-18T10:00:00Z');

      expect(manager.isDeadlineBreached(deadline, settledAt)).toBe(true);
    });

    it('should return true if unsettled and past deadline', () => {
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past

      expect(manager.isDeadlineBreached(pastDeadline)).toBe(true);
    });
  });

  describe('getDeadlineStatus', () => {
    it('should return remaining hours when unsettled and in SLA', () => {
      const futureDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours ahead

      const status = manager.getDeadlineStatus(futureDeadline);

      expect(status.isBreached).toBe(false);
      expect(status.remainingHours).toBeGreaterThanOrEqual(47);
      expect(status.statusDescription).toContain('remaining until statutory refund deadline');
    });

    it('should indicate breach when past deadline', () => {
      const pastDeadline = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago

      const status = manager.getDeadlineStatus(pastDeadline);

      expect(status.isBreached).toBe(true);
      expect(status.statusDescription).toContain('Regulatory SLA breached');
    });
  });
});
