import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { OtpService } from './services/otp.service';
import { TokenService, AuthTokens } from './services/token.service';
import { ResendEmailService } from './services/resend-email.service';
import { PhoneUtils } from '../../common/utils/phone.utils';
import { UserRole } from '@prisma/client';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/otp.dto';
import { EmailUtils } from '../../common/utils/email.utils';

interface PasswordResetRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly passwordResetStore = new Map<string, PasswordResetRecord>();
  private readonly emailResetRateLimit = new Map<string, number[]>();
  private readonly ipResetRateLimit = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly resendEmailService: ResendEmailService,
  ) {}

  /**
   * Registers a customer account with Name, Phone, Email, and Password.
   * Includes rigorous edge-case validation for Gmail, disposable domains, and phone numbers.
   */
  async register(dto: RegisterDto): Promise<{ user: unknown; tokens: AuthTokens }> {
    // 1. Sanitize & Validate Name
    const cleanName = (dto.fullName || '').trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2) {
      throw new BadRequestException('Please enter your full name (at least 2 characters).');
    }

    // 2. Normalize & Validate Bangladeshi Phone
    const normalizedPhone = PhoneUtils.normalize(dto.phone);

    // 3. Normalize & Validate Gmail / Email Address (Catches typos like gamil.com, blocks disposable domains)
    const normalizedEmail = EmailUtils.validateAndNormalize(dto.email);

    // 4. Password Security Edge Cases
    const cleanPassword = (dto.password || '').trim();
    if (cleanPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }
    if (cleanPassword === '123456' || cleanPassword === 'password' || cleanPassword === normalizedPhone) {
      throw new BadRequestException('Please choose a slightly stronger password for your account security.');
    }

    // 5. Uniqueness Check
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { email: normalizedEmail },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.phone === normalizedPhone) {
        throw new BadRequestException('An account with this phone number already exists. Please log in.');
      }
      throw new BadRequestException('An account with this email address already exists. Please log in.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        fullName: cleanName,
        passwordHash,
        role: UserRole.CUSTOMER,
        isPhoneVerified: true,
      },
    });

    await this.prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        tier: 'BRONZE',
      },
    });

    const tokens = await this.tokenService.generateTokens(user.id, user.phone, user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Simple customer login with Phone or Email and Password.
   */
  async loginWithPassword(dto: LoginDto): Promise<{ user: unknown; tokens: AuthTokens }> {
    const cleanId = (dto.identifier || '').trim();
    if (!cleanId) {
      throw new BadRequestException('Please enter your phone number or Gmail/email address.');
    }
    const cleanPass = (dto.password || '').trim();
    if (!cleanPass) {
      throw new BadRequestException('Please enter your password.');
    }

    let searchPhone = '';
    let searchEmail = '';

    if (cleanId.includes('@')) {
      searchEmail = cleanId.toLowerCase();
    } else {
      try {
        searchPhone = PhoneUtils.normalize(cleanId);
      } catch {
        searchPhone = cleanId;
      }
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(searchPhone ? [{ phone: searchPhone }] : []),
          ...(searchEmail ? [{ email: searchEmail }] : []),
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Incorrect phone/email or password.');
    }

    const isMatch = await bcrypt.compare(cleanPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect phone/email or password.');
    }

    if (user.isBlacklisted) {
      throw new BadRequestException('This account has been suspended.');
    }

    const tokens = await this.tokenService.generateTokens(user.id, user.phone, user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Dispatches OTP to Bangladeshi phone number after normalization and rate-limiting.
   */
  async sendOtp(rawPhone: string, ipAddress: string) {
    const normalizedPhone = PhoneUtils.normalize(rawPhone);
    return this.otpService.generateAndSendOtp(normalizedPhone, ipAddress);
  }

  /**
   * Verifies OTP, upserts user account, and returns authenticated JWT tokens.
   */
  async verifyOtpAndLogin(rawPhone: string, code: string): Promise<{ user: unknown; tokens: AuthTokens }> {
    const normalizedPhone = PhoneUtils.normalize(rawPhone);
    await this.otpService.verifyOtp(normalizedPhone, code);

    // Upsert customer user in database
    let user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          role: UserRole.CUSTOMER,
          isPhoneVerified: true,
        },
      });

      // Initialize loyalty account for new customer
      await this.prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          tier: 'BRONZE',
        },
      });
    } else if (!user.isPhoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    if (user.isBlacklisted) {
      throw new BadRequestException('This account has been suspended due to security or fraud violations.');
    }

    const tokens = await this.tokenService.generateTokens(user.id, user.phone, user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
      },
      tokens,
    };
  }

  /**
   * Rotates access and refresh tokens.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isBlacklisted) {
      throw new NotFoundException('User account not found or suspended');
    }

    // Revoke old refresh token JTI
    this.tokenService.revokeToken(payload.jti);

    // Issue fresh token pair
    return this.tokenService.generateTokens(user.id, user.phone, user.role);
  }

  /**
   * Revokes token JTI on user logout, and revokes refresh token if provided.
   */
  async logout(jti?: string, refreshToken?: string) {
    if (jti) {
      this.tokenService.revokeToken(jti);
    }
    if (refreshToken) {
      try {
        const payload = await this.tokenService.verifyRefreshToken(refreshToken);
        if (payload?.jti) {
          this.tokenService.revokeToken(payload.jti);
        }
      } catch {
        // Token might already be expired, proceed safely
      }
    }
    return { success: true, message: 'Logged out of SEYVEN Sanctuary successfully' };
  }

  /**
   * Silently verifies token for logout purposes without throwing 401
   */
  async verifyAccessTokenSilently(token: string) {
    try {
      return await this.tokenService.verifyAccessToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Retrieves full customer profile.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        loyaltyAccount: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      loyalty: user.loyaltyAccount,
      createdAt: user.createdAt,
    };
  }

  /**
   * Dispatches a 6-digit password reset code to customer's email via Resend.
   * Handles rate-limiting, typo detection, and account privacy.
   */
  async forgotPassword(rawEmail: string, ipAddress: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    const cleanEmail = (rawEmail || '').trim();
    if (!cleanEmail) {
      throw new BadRequestException('Please enter your email address.');
    }

    // Typo detection & RFC normalization
    const normalizedEmail = EmailUtils.validateAndNormalize(cleanEmail);

    // Rate Limiting by IP (10 requests / hr)
    const now = Date.now();
    const ipHistory = (this.ipResetRateLimit.get(ipAddress) || []).filter(t => now - t < 3600000);
    if (ipHistory.length >= 10) {
      throw new BadRequestException('Too many password reset requests from this network. Please try again later.');
    }
    ipHistory.push(now);
    this.ipResetRateLimit.set(ipAddress, ipHistory);

    // Rate Limiting by Email (3 requests / 10 mins)
    const emailHistory = (this.emailResetRateLimit.get(normalizedEmail) || []).filter(t => now - t < 600000);
    if (emailHistory.length >= 3) {
      throw new BadRequestException('Too many reset requests for this email. Please wait 10 minutes before trying again.');
    }
    emailHistory.push(now);
    this.emailResetRateLimit.set(normalizedEmail, emailHistory);

    // Check user existence
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    // Privacy-preserving: if account doesn't exist, don't disclose existence
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, a 6-digit verification code has been dispatched. Please check your inbox and spam folder.',
        expiresInSeconds: 600,
      };
    }

    // 6-digit secure numeric code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const ttlMs = 10 * 60 * 1000; // 10 minutes

    this.passwordResetStore.set(normalizedEmail, {
      code: resetCode,
      expiresAt: now + ttlMs,
      attempts: 0,
    });

    // Dispatch email via Resend
    await this.resendEmailService.sendPasswordResetEmail(normalizedEmail, resetCode, user.fullName || 'Valued Client');

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      expiresInSeconds: 600,
    };
  }

  /**
   * Verifies the 6-digit code and securely updates user password.
   * Immediately issues authenticated tokens for automatic frictionless login.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string; user: unknown; tokens: AuthTokens }> {
    const cleanEmail = (dto.email || '').trim();
    if (!cleanEmail) {
      throw new BadRequestException('Email address is required.');
    }
    const normalizedEmail = EmailUtils.validateAndNormalize(cleanEmail);

    const record = this.passwordResetStore.get(normalizedEmail);
    if (!record || Date.now() > record.expiresAt) {
      this.passwordResetStore.delete(normalizedEmail);
      throw new BadRequestException('The verification code has expired or is invalid. Please request a new code.');
    }

    if (record.attempts >= 5) {
      this.passwordResetStore.delete(normalizedEmail);
      throw new BadRequestException('Too many incorrect verification attempts. For your account security, please request a new code.');
    }

    if (record.code !== dto.code.trim()) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      throw new BadRequestException(`Incorrect verification code. Please check your email. (${remaining} attempts remaining)`);
    }

    // Password validation edge cases
    const cleanPassword = (dto.newPassword || '').trim();
    if (cleanPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long.');
    }
    if (cleanPassword === '123456' || cleanPassword === 'password') {
      throw new BadRequestException('Please choose a slightly stronger password for your account security.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found for this email address.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate code immediately (single-use)
    this.passwordResetStore.delete(normalizedEmail);

    // Auto-login tokens
    const tokens = await this.tokenService.generateTokens(user.id, user.phone, user.role);

    return {
      success: true,
      message: 'Your password has been securely updated. You are now logged in.',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }
}


