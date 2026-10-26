/**
 * Utility for Bangladeshi Mobile Phone Number Normalization and Validation
 * Standardizes inputs (017..., +88017..., 88017..., 017-...) into clean E.164 / local formats.
 */
export class BangladeshiPhoneUtil {
  private static readonly BD_MOBILE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

  /**
   * Validates if a string is a valid Bangladeshi mobile operator number
   */
  static isValid(phone: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return this.BD_MOBILE_REGEX.test(cleaned);
  }

  /**
   * Normalizes to 11-digit local format: 01XXXXXXXXX
   */
  static toLocalFormat(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('880')) {
      return '0' + cleaned.substring(3);
    }
    if (cleaned.startsWith('0')) {
      return cleaned;
    }
    return '0' + cleaned;
  }

  /**
   * Normalizes to standard 13-digit E.164 format with country code (no '+'): 8801XXXXXXXXX
   * Preferred by Meta WhatsApp Cloud API and SMS Gateways.
   */
  static toInternationalFormat(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('880')) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '88' + cleaned;
    }
    return '880' + cleaned;
  }

  /**
   * Identifies mobile operator name for routing / reporting
   */
  static getOperator(phone: string): string {
    const local = this.toLocalFormat(phone);
    if (local.length < 3) return 'UNKNOWN';
    const prefix = local.substring(0, 3);
    switch (prefix) {
      case '017':
      case '013':
        return 'Grameenphone';
      case '018':
        return 'Robi';
      case '019':
      case '014':
        return 'Banglalink';
      case '015':
        return 'Teletalk';
      case '016':
        return 'Airtel';
      default:
        return 'OTHER';
    }
  }
}
