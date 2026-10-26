import { OtpService } from './otp.service';
import { BadRequestException, HttpException } from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    service = new OtpService();
  });

  it('should generate a 6-digit OTP successfully', async () => {
    const result = await service.generateAndSendOtp('+8801712345678', '127.0.0.1');
    expect(result.success).toBe(true);
    expect(result.expiresInSeconds).toBe(180);
  });

  it('should enforce phone sliding-window rate limit after 3 attempts', async () => {
    await service.generateAndSendOtp('+8801712345678', '127.0.0.1');
    await service.generateAndSendOtp('+8801712345678', '127.0.0.1');
    await service.generateAndSendOtp('+8801712345678', '127.0.0.1');

    await expect(
      service.generateAndSendOtp('+8801712345678', '127.0.0.1'),
    ).rejects.toThrow(HttpException);
  });

  it('should reject incorrect OTP and invalidate on 3 failed attempts', async () => {
    await service.generateAndSendOtp('+8801812345678', '127.0.0.1');

    await expect(service.verifyOtp('+8801812345678', '000000')).rejects.toThrow(BadRequestException);
    await expect(service.verifyOtp('+8801812345678', '000000')).rejects.toThrow(BadRequestException);
    await expect(service.verifyOtp('+8801812345678', '000000')).rejects.toThrow(BadRequestException);

    // 4th attempt should indicate locked/no OTP
    await expect(service.verifyOtp('+8801812345678', '000000')).rejects.toThrow(BadRequestException);
  });
});
