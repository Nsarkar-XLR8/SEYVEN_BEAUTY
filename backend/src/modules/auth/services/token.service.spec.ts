import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal: string) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should generate paired access and refresh tokens', async () => {
    const tokens = await service.generateTokens('user-uuid-1', '+8801700000000', 'CUSTOMER');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresInSeconds).toBe(900);
  });

  it('should verify valid access token', async () => {
    const tokens = await service.generateTokens('user-uuid-1', '+8801700000000', 'CUSTOMER');
    const payload = await service.verifyAccessToken(tokens.accessToken);
    expect(payload.sub).toBe('user-uuid-1');
    expect(payload.role).toBe('CUSTOMER');
  });

  it('should reject blacklisted tokens', async () => {
    const tokens = await service.generateTokens('user-uuid-1', '+8801700000000', 'CUSTOMER');
    const payload = await service.verifyAccessToken(tokens.accessToken);

    service.revokeToken(payload.jti);

    await expect(service.verifyAccessToken(tokens.accessToken)).rejects.toThrow('Token has been revoked');
  });
});
