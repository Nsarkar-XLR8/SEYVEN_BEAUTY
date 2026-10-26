import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QuietHoursManager } from './quiet-hours.manager';

describe('QuietHoursManager', () => {
  let manager: QuietHoursManager;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'SMS_QUIET_HOURS_ENABLED') return true;
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuietHoursManager,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    manager = module.get<QuietHoursManager>(QuietHoursManager);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('checkQuietHours & canDispatchImmediately', () => {
    it('should flag as quiet hour at 23:30 BST (17:30 UTC)', () => {
      // 17:30 UTC = 23:30 BST (UTC+6)
      const lateNightDate = new Date('2026-10-16T17:30:00.000Z');
      const result = manager.checkQuietHours(lateNightDate);

      expect(result.isQuietHour).toBe(true);
      expect(result.currentBstHour).toBe(23);
      expect(result.currentBstMinute).toBe(30);

      const dispatchCheck = manager.canDispatchImmediately(false, lateNightDate);
      expect(dispatchCheck.allowed).toBe(false);
      expect(dispatchCheck.reason).toContain('BTRC commercial quiet hours');
    });

    it('should flag as quiet hour at 04:00 BST (22:00 UTC previous day)', () => {
      // 22:00 UTC = 04:00 BST next day
      const earlyMorningDate = new Date('2026-10-15T22:00:00.000Z');
      const result = manager.checkQuietHours(earlyMorningDate);

      expect(result.isQuietHour).toBe(true);
      expect(result.currentBstHour).toBe(4);

      const dispatchCheck = manager.canDispatchImmediately(false, earlyMorningDate);
      expect(dispatchCheck.allowed).toBe(false);
    });

    it('should allow commercial dispatch during active daytime window (14:00 BST = 08:00 UTC)', () => {
      // 08:00 UTC = 14:00 BST
      const afternoonDate = new Date('2026-10-16T08:00:00.000Z');
      const result = manager.checkQuietHours(afternoonDate);

      expect(result.isQuietHour).toBe(false);
      expect(result.currentBstHour).toBe(14);

      const dispatchCheck = manager.canDispatchImmediately(false, afternoonDate);
      expect(dispatchCheck.allowed).toBe(true);
    });

    it('should ALWAYS allow urgent messages (e.g. OTP) even at 02:00 BST', () => {
      const midnightDate = new Date('2026-10-15T20:00:00.000Z'); // 02:00 BST
      const dispatchCheck = manager.canDispatchImmediately(true, midnightDate);

      expect(dispatchCheck.allowed).toBe(true);
      expect(dispatchCheck.reason).toBeUndefined();
    });

    it('should allow all messages when SMS_QUIET_HOURS_ENABLED is false', () => {
      configService.get.mockReturnValue(false);
      const lateNightDate = new Date('2026-10-16T17:30:00.000Z');
      const result = manager.checkQuietHours(lateNightDate);

      expect(result.isQuietHour).toBe(false);
    });
  });
});
