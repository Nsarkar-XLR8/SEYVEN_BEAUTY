import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuietHoursCheckResult } from '../interfaces/sms.interface';

@Injectable()
export class QuietHoursManager {
  private readonly logger = new Logger(QuietHoursManager.name);

  // Bangladesh Standard Time is UTC+6
  private static readonly BST_OFFSET_HOURS = 6;
  public static readonly QUIET_HOURS_START = 22; // 10:00 PM BST
  public static readonly QUIET_HOURS_END = 8; // 8:00 AM BST

  constructor(private readonly configService: ConfigService) {}

  /**
   * Determines if the current or given time falls within the BTRC quiet hours window (22:00 to 08:00 BST).
   * @param referenceDate Optional date for deterministic unit testing; defaults to Date.now()
   */
  checkQuietHours(referenceDate?: Date): QuietHoursCheckResult {
    const isEnabled = this.configService.get<boolean>('SMS_QUIET_HOURS_ENABLED') ?? true;
    if (!isEnabled) {
      return {
        isQuietHour: false,
        currentBstHour: 12,
        currentBstMinute: 0,
        nextAllowedWindowAt: new Date(),
      };
    }

    const now = referenceDate || new Date();
    // Convert to BST (UTC+6)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const bstTime = new Date(utcTime + QuietHoursManager.BST_OFFSET_HOURS * 3600000);

    const bstHour = bstTime.getHours();
    const bstMinute = bstTime.getMinutes();

    // Quiet hours: hour >= 22 (10:00 PM) OR hour < 8 (before 8:00 AM)
    const isQuietHour = bstHour >= QuietHoursManager.QUIET_HOURS_START || bstHour < QuietHoursManager.QUIET_HOURS_END;

    // Calculate when the next 8:00 AM BST window opens
    const nextAllowedWindowBst = new Date(bstTime);
    if (bstHour >= QuietHoursManager.QUIET_HOURS_START) {
      // It's after 10 PM BST -> next allowed window is tomorrow 8:00 AM BST
      nextAllowedWindowBst.setDate(nextAllowedWindowBst.getDate() + 1);
      nextAllowedWindowBst.setHours(QuietHoursManager.QUIET_HOURS_END, 0, 0, 0);
    } else if (bstHour < QuietHoursManager.QUIET_HOURS_END) {
      // It's before 8 AM BST -> next allowed window is today 8:00 AM BST
      nextAllowedWindowBst.setHours(QuietHoursManager.QUIET_HOURS_END, 0, 0, 0);
    } else {
      // Currently within active allowed window
      nextAllowedWindowBst.setTime(bstTime.getTime());
    }

    // Convert nextAllowedWindowBst back to UTC/local Date
    const nextAllowedWindowUtc = new Date(
      nextAllowedWindowBst.getTime() - QuietHoursManager.BST_OFFSET_HOURS * 3600000,
    );

    return {
      isQuietHour,
      currentBstHour: bstHour,
      currentBstMinute: bstMinute,
      nextAllowedWindowAt: nextAllowedWindowUtc,
    };
  }

  /**
   * Evaluates if a message can be immediately dispatched.
   * Urgent messages (e.g. OTPs) ALWAYS bypass quiet hours.
   */
  canDispatchImmediately(isUrgent?: boolean, referenceDate?: Date): { allowed: boolean; reason?: string } {
    if (isUrgent) {
      return { allowed: true };
    }

    const check = this.checkQuietHours(referenceDate);
    if (check.isQuietHour) {
      const formattedBst = `${String(check.currentBstHour).padStart(2, '0')}:${String(check.currentBstMinute).padStart(2, '0')} BST`;
      return {
        allowed: false,
        reason: `Suppressed due to BTRC commercial quiet hours (10:00 PM - 08:00 AM BST). Current time: ${formattedBst}. Next window opens at ${check.nextAllowedWindowAt.toISOString()}`,
      };
    }

    return { allowed: true };
  }
}
