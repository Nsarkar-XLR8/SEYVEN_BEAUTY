import * as crypto from 'crypto';

export class PiiHasher {
  /**
   * Hashes an arbitrary string using SHA-256 and outputs lowercase hex string.
   */
  static hashSha256(val: string): string {
    return crypto.createHash('sha256').update(val.trim()).digest('hex');
  }

  /**
   * Normalizes email address (trimmed, all lowercase) and hashes with SHA-256.
   * Returns undefined if input is missing or empty.
   */
  static normalizeAndHashEmail(email?: string | null): string | undefined {
    if (!email || !email.trim()) {
      return undefined;
    }
    const normalized = email.trim().toLowerCase();
    return this.hashSha256(normalized);
  }

  /**
   * Normalizes Bangladeshi/international phone numbers and hashes with SHA-256.
   * Strips all non-digit characters (+, -, spaces, parentheses).
   * For Bangladeshi 11-digit numbers starting with 01XXXXXXXXX, prepends country code 88.
   */
  static normalizeAndHashPhone(phone?: string | null): string | undefined {
    if (!phone || !phone.trim()) {
      return undefined;
    }
    // Remove all non-numeric characters
    let digits = phone.replace(/\D/g, '');

    // If starts with 01 and 11 digits, prepend BD country code 88 -> 8801XXXXXXXXX
    if (digits.startsWith('01') && digits.length === 11) {
      digits = `88${digits}`;
    }

    if (!digits) {
      return undefined;
    }

    return this.hashSha256(digits);
  }

  /**
   * Normalizes a text field (e.g. city, first name, last name) and hashes with SHA-256.
   */
  static normalizeAndHashField(val?: string | null): string | undefined {
    if (!val || !val.trim()) {
      return undefined;
    }
    const normalized = val.trim().toLowerCase().replace(/\s+/g, ' ');
    return this.hashSha256(normalized);
  }
}
