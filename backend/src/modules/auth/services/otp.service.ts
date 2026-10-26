import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../../../common/redis/redis.service';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // In-memory stores with Redis-compatible semantics
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly phoneRateLimit = new Map<string, RateLimitRecord>();
  private readonly ipRateLimit = new Map<string, RateLimitRecord>();

  private readonly OTP_TTL_MS = 3 * 60 * 1000; // 3 minutes
  private readonly PHONE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_OTP_PER_PHONE = 3;
  private readonly IP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_OTP_PER_IP = 10;

  constructor(@Optional() private readonly redis?: RedisService) {}

  /**
   * Generates and stores a cryptographic 6-digit OTP after checking rate limits.
   */
  async generateAndSendOtp(phone: string, ipAddress: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    this.checkRateLimit(phone, ipAddress);

    // Cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + this.OTP_TTL_MS;

    this.otpStore.set(phone, {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    if (this.redis) {
      await this.redis.set(`auth:otp:${phone}`, otpCode, 'EX', 180);
    }

    this.recordRateLimitAttempt(phone, ipAddress);

    // In production, this dispatches via SMS Gateway BullMQ worker
    this.logger.log(`📱 [SMS OTP] Dispatched OTP to ${phone}: ${otpCode} (Valid for 3 mins)`);

    return {
      success: true,
      message: 'OTP sent successfully to your mobile number',
      expiresInSeconds: 180,
    };
  }

  /**
   * Verifies the provided 6-digit OTP for the given phone number.
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    let record = this.otpStore.get(phone);

    if (!record && this.redis) {
      const redisCode = await this.redis.get(`auth:otp:${phone}`);
      if (redisCode) {
        record = {
          code: redisCode,
          expiresAt: Date.now() + this.OTP_TTL_MS,
          attempts: 0,
        };
        this.otpStore.set(phone, record);
      }
    }

    if (!record) {
      throw new BadRequestException('No OTP was requested for this phone number or it has expired');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      if (this.redis) {
        await this.redis.del(`auth:otp:${phone}`);
      }
      throw new BadRequestException('OTP has expired. Please request a new code');
    }

    if (record.attempts >= 3) {
      this.otpStore.delete(phone);
      if (this.redis) {
        await this.redis.del(`auth:otp:${phone}`);
      }
      throw new BadRequestException('Too many incorrect attempts. Please request a new OTP');
    }

    if (record.code !== code) {
      record.attempts += 1;
      throw new BadRequestException('Invalid OTP code. Please try again');
    }

    // Successfully verified -> Delete OTP to prevent replay
    this.otpStore.delete(phone);
    if (this.redis) {
      await this.redis.del(`auth:otp:${phone}`);
    }
    return true;
  }

  private checkRateLimit(phone: string, ipAddress: string): void {
    const now = Date.now();

    // Check Phone sliding window rate limit
    const phoneRecord = this.phoneRateLimit.get(phone);
    if (phoneRecord) {
      const recentAttempts = phoneRecord.timestamps.filter(
        (t) => now - t < this.PHONE_RATE_LIMIT_WINDOW_MS,
      );
      if (recentAttempts.length >= this.MAX_OTP_PER_PHONE) {
        throw new HttpException(
          'Too many OTP requests for this phone number. Please wait 10 minutes before trying again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Check IP sliding window rate limit
    const ipRecord = this.ipRateLimit.get(ipAddress);
    if (ipRecord) {
      const recentAttempts = ipRecord.timestamps.filter(
        (t) => now - t < this.IP_RATE_LIMIT_WINDOW_MS,
      );
      if (recentAttempts.length >= this.MAX_OTP_PER_IP) {
        throw new HttpException(
          'Too many OTP requests from this network. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  private recordRateLimitAttempt(phone: string, ipAddress: string): void {
    const now = Date.now();

    const phoneRecord = this.phoneRateLimit.get(phone) || { timestamps: [] };
    phoneRecord.timestamps = phoneRecord.timestamps.filter((t) => now - t < this.PHONE_RATE_LIMIT_WINDOW_MS);
    phoneRecord.timestamps.push(now);
    this.phoneRateLimit.set(phone, phoneRecord);

    const ipRecord = this.ipRateLimit.get(ipAddress) || { timestamps: [] };
    ipRecord.timestamps = ipRecord.timestamps.filter((t) => now - t < this.IP_RATE_LIMIT_WINDOW_MS);
    ipRecord.timestamps.push(now);
    this.ipRateLimit.set(ipAddress, ipRecord);
  }
}
