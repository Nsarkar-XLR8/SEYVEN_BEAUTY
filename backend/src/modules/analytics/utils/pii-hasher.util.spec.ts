import { PiiHasher } from './pii-hasher.util';
import * as crypto from 'crypto';

describe('PiiHasher Utility', () => {
  describe('hashSha256', () => {
    it('should compute valid sha256 lowercase hex hash', () => {
      const input = 'test-value';
      const expected = crypto.createHash('sha256').update(input).digest('hex');
      expect(PiiHasher.hashSha256(input)).toBe(expected);
    });
  });

  describe('normalizeAndHashEmail', () => {
    it('should trim and lowercase email before hashing', () => {
      const raw = '  Ayesha.Rahman@Seyven.COM  ';
      const normalized = 'ayesha.rahman@seyven.com';
      const expected = crypto.createHash('sha256').update(normalized).digest('hex');

      expect(PiiHasher.normalizeAndHashEmail(raw)).toBe(expected);
    });

    it('should return undefined for empty or whitespace-only email', () => {
      expect(PiiHasher.normalizeAndHashEmail('')).toBeUndefined();
      expect(PiiHasher.normalizeAndHashEmail('   ')).toBeUndefined();
      expect(PiiHasher.normalizeAndHashEmail(undefined)).toBeUndefined();
      expect(PiiHasher.normalizeAndHashEmail(null)).toBeUndefined();
    });
  });

  describe('normalizeAndHashPhone', () => {
    it('should normalize 11-digit Bangladeshi 01XXXXXXXXX number with 88 country code', () => {
      const raw = '01712345678';
      const expectedDigits = '8801712345678';
      const expectedHash = crypto.createHash('sha256').update(expectedDigits).digest('hex');

      expect(PiiHasher.normalizeAndHashPhone(raw)).toBe(expectedHash);
    });

    it('should strip special characters, spaces, and plus signs', () => {
      const raw = '+88 (017) 12-34-5678';
      const expectedDigits = '8801712345678';
      const expectedHash = crypto.createHash('sha256').update(expectedDigits).digest('hex');

      expect(PiiHasher.normalizeAndHashPhone(raw)).toBe(expectedHash);
    });

    it('should return undefined for empty or invalid phone', () => {
      expect(PiiHasher.normalizeAndHashPhone('')).toBeUndefined();
      expect(PiiHasher.normalizeAndHashPhone(null)).toBeUndefined();
      expect(PiiHasher.normalizeAndHashPhone('---')).toBeUndefined();
    });
  });

  describe('normalizeAndHashField', () => {
    it('should trim, lowercase, and collapse multiple whitespace', () => {
      const raw = '  Dhaka   City  ';
      const expected = crypto.createHash('sha256').update('dhaka city').digest('hex');

      expect(PiiHasher.normalizeAndHashField(raw)).toBe(expected);
    });

    it('should return undefined for empty strings', () => {
      expect(PiiHasher.normalizeAndHashField('')).toBeUndefined();
      expect(PiiHasher.normalizeAndHashField(null)).toBeUndefined();
    });
  });
});
