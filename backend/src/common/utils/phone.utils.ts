import { BadRequestException } from '@nestjs/common';

export class PhoneUtils {
  private static readonly BD_PHONE_REGEX = /^(?:\+?880|880|0)?(1[3-9]\d{8})$/;

  /**
   * Validates and normalizes any Bangladeshi phone number input into canonical E.164 format (+8801XXXXXXXXX).
   */
  public static normalize(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Phone number is required');
    }

    const cleanNumber = phone.replace(/[\s\-_]/g, '');
    const match = cleanNumber.match(this.BD_PHONE_REGEX);

    if (!match || !match[1]) {
      throw new BadRequestException(
        `Invalid Bangladeshi phone number: "${phone}". Expected format: +8801XXXXXXXXX or 01XXXXXXXXX`,
      );
    }

    return `+880${match[1]}`;
  }

  /**
   * Checks if phone number is valid without throwing an exception.
   */
  public static isValid(phone: string): boolean {
    try {
      this.normalize(phone);
      return true;
    } catch {
      return false;
    }
  }
}
