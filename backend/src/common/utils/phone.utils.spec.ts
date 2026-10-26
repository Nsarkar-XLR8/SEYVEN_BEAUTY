import { PhoneUtils } from './phone.utils';
import { BadRequestException } from '@nestjs/common';

describe('PhoneUtils', () => {
  it('should normalize standard 11-digit local phone number', () => {
    expect(PhoneUtils.normalize('01712345678')).toBe('+8801712345678');
    expect(PhoneUtils.normalize('01312345678')).toBe('+8801312345678');
    expect(PhoneUtils.normalize('01912345678')).toBe('+8801912345678');
  });

  it('should normalize phone numbers with +88 or 88 prefix', () => {
    expect(PhoneUtils.normalize('+8801812345678')).toBe('+8801812345678');
    expect(PhoneUtils.normalize('8801612345678')).toBe('+8801612345678');
  });

  it('should strip spaces and hyphens', () => {
    expect(PhoneUtils.normalize('0171-234 5678')).toBe('+8801712345678');
  });

  it('should reject invalid length or carrier prefixes', () => {
    expect(() => PhoneUtils.normalize('01212345678')).toThrow(BadRequestException);
    expect(() => PhoneUtils.normalize('017123456')).toThrow(BadRequestException);
    expect(() => PhoneUtils.normalize('0171234567890')).toThrow(BadRequestException);
    expect(() => PhoneUtils.normalize('abcdefghijk')).toThrow(BadRequestException);
  });

  it('should validate phone without throwing', () => {
    expect(PhoneUtils.isValid('01712345678')).toBe(true);
    expect(PhoneUtils.isValid('invalid')).toBe(false);
  });
});
