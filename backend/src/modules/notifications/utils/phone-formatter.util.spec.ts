import { BangladeshiPhoneUtil } from './phone-formatter.util';

describe('BangladeshiPhoneUtil', () => {
  describe('isValid', () => {
    it('should validate valid 11-digit local mobile numbers', () => {
      expect(BangladeshiPhoneUtil.isValid('01712345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('01812345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('01912345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('01512345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('01312345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('01412345678')).toBe(true);
    });

    it('should validate formatted numbers with spaces, dashes, or +880', () => {
      expect(BangladeshiPhoneUtil.isValid('+8801712345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('8801712345678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('017-1234-5678')).toBe(true);
      expect(BangladeshiPhoneUtil.isValid('+880 17 1234 5678')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(BangladeshiPhoneUtil.isValid('01212345678')).toBe(false); // 012 is invalid in BD
      expect(BangladeshiPhoneUtil.isValid('0171234567')).toBe(false); // 10 digits
      expect(BangladeshiPhoneUtil.isValid('017123456789')).toBe(false); // 12 digits
      expect(BangladeshiPhoneUtil.isValid('')).toBe(false);
      expect(BangladeshiPhoneUtil.isValid('invalid')).toBe(false);
    });
  });

  describe('toLocalFormat', () => {
    it('should normalize international and formatted numbers to 11-digit local format', () => {
      expect(BangladeshiPhoneUtil.toLocalFormat('+8801712345678')).toBe('01712345678');
      expect(BangladeshiPhoneUtil.toLocalFormat('8801812345678')).toBe('01812345678');
      expect(BangladeshiPhoneUtil.toLocalFormat('019-1234-5678')).toBe('01912345678');
    });
  });

  describe('toInternationalFormat', () => {
    it('should normalize local numbers to 13-digit E.164 (without +) format', () => {
      expect(BangladeshiPhoneUtil.toInternationalFormat('01712345678')).toBe('8801712345678');
      expect(BangladeshiPhoneUtil.toInternationalFormat('+8801712345678')).toBe('8801712345678');
      expect(BangladeshiPhoneUtil.toInternationalFormat('8801712345678')).toBe('8801712345678');
    });
  });

  describe('getOperator', () => {
    it('should identify mobile network operator by prefix', () => {
      expect(BangladeshiPhoneUtil.getOperator('01712345678')).toBe('Grameenphone');
      expect(BangladeshiPhoneUtil.getOperator('01312345678')).toBe('Grameenphone');
      expect(BangladeshiPhoneUtil.getOperator('01812345678')).toBe('Robi');
      expect(BangladeshiPhoneUtil.getOperator('01612345678')).toBe('Airtel');
      expect(BangladeshiPhoneUtil.getOperator('01912345678')).toBe('Banglalink');
      expect(BangladeshiPhoneUtil.getOperator('01512345678')).toBe('Teletalk');
    });
  });
});
