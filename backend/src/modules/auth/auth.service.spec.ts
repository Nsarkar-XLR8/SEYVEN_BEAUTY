import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { UserRole } from '@prisma/client';
import { ResendEmailService } from './services/resend-email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let otpService: OtpService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-user-1', ...data })),
              update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
            },
            loyaltyAccount: {
              create: jest.fn().mockResolvedValue({ id: 'loyalty-1' }),
            },
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateAndSendOtp: jest.fn().mockResolvedValue({ success: true, message: 'OTP Sent', expiresInSeconds: 180 }),
            verifyOtp: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokens: jest.fn().mockResolvedValue({
              accessToken: 'mock-jwt-access',
              refreshToken: 'mock-jwt-refresh',
              expiresInSeconds: 900,
            }),
            verifyRefreshToken: jest.fn().mockResolvedValue({ sub: 'new-user-1', phone: '+8801700000000', role: 'CUSTOMER', jti: 'jti-1' }),
            revokeToken: jest.fn(),
          },
        },
        {
          provide: ResendEmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
            sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-2' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize phone and send OTP', async () => {
    const result = await service.sendOtp('01712345678', '127.0.0.1');
    expect(result.success).toBe(true);
    expect(otpService.generateAndSendOtp).toHaveBeenCalledWith('+8801712345678', '127.0.0.1');
  });

  it('should verify OTP and upsert new customer user with loyalty account', async () => {
    const result = await service.verifyOtpAndLogin('01712345678', '123456');

    expect(result.tokens.accessToken).toBe('mock-jwt-access');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+8801712345678',
          role: UserRole.CUSTOMER,
        }),
      }),
    );
    expect(prisma.loyaltyAccount.create).toHaveBeenCalled();
  });

  it('should rotate tokens on refresh', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'new-user-1',
      phone: '+8801700000000',
      role: UserRole.CUSTOMER,
      isBlacklisted: false,
      email: null,
      fullName: null,
      isPhoneVerified: true,
      fraudRiskScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const tokens = await service.refreshTokens('mock-refresh-token');
    expect(tokens.accessToken).toBe('mock-jwt-access');
    expect(tokenService.revokeToken).toHaveBeenCalledWith('jti-1');
  });
});
