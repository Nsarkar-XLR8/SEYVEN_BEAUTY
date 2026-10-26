import { Test, TestingModule } from '@nestjs/testing';
import { PreviewTokenService } from './preview-token.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('PreviewTokenService', () => {
  let service: PreviewTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreviewTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-preview-secret-key-12345'),
          },
        },
      ],
    }).compile();

    service = module.get<PreviewTokenService>(PreviewTokenService);
  });

  it('should generate and verify valid preview token', () => {
    const token = service.generatePreviewToken('product-uuid-1', 60);
    const verifiedId = service.verifyPreviewToken(token);

    expect(verifiedId).toBe('product-uuid-1');
  });

  it('should reject tampered preview token', () => {
    const token = service.generatePreviewToken('product-uuid-1', 60);
    const tampered = token.slice(0, -4) + 'abcd';

    expect(() => service.verifyPreviewToken(tampered)).toThrow(UnauthorizedException);
  });

  it('should reject expired preview token', () => {
    const expiredToken = service.generatePreviewToken('product-uuid-1', -10); // Expired 10 mins ago

    expect(() => service.verifyPreviewToken(expiredToken)).toThrow(UnauthorizedException);
  });
});
