import { BadRequestException } from '@nestjs/common';

export class EmailUtils {
  // Comprehensive RFC 5322 compliant email regex
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  // Common typos made by users in Bangladesh when typing Gmail or major providers
  private static readonly TYPO_DOMAIN_MAP: Record<string, string> = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmaul.com': 'gmail.com',
    'gml.com': 'gmail.com',
    'gmaik.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yaho.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
  };

  // Known disposable / fake temporary email domains to prevent coupon & account abuse
  private static readonly DISPOSABLE_DOMAINS = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'yopmail.com',
    'sharklasers.com',
    'throwaway.com',
    'dispostable.com',
    'trashmail.com',
    'getairmail.com',
    'fakeinbox.com',
    'generator.email',
  ]);

  /**
   * Validates and normalizes an email address with thorough edge-case handling.
   * - Strips surrounding whitespace
   * - Converts to lowercase
   * - Blocks disposable/burner domains
   * - Catches common typos (e.g. gamil.com -> recommends gmail.com)
   * - Validates RFC syntax and domain structure
   */
  public static validateAndNormalize(rawEmail: string): string {
    if (!rawEmail || typeof rawEmail !== 'string') {
      throw new BadRequestException('Email address is required.');
    }

    const email = rawEmail.trim().toLowerCase();

    // Length constraints
    if (email.length < 5 || email.length > 254) {
      throw new BadRequestException('Email address must be between 5 and 254 characters.');
    }

    // Basic format check
    if (!this.EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Please enter a valid email address (e.g. yourname@gmail.com).');
    }

    const [localPart, domain] = email.split('@');

    // Local-part checks
    if (!localPart || localPart.length > 64) {
      throw new BadRequestException('Invalid email format before the @ symbol.');
    }
    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      throw new BadRequestException('Email address cannot start, end, or contain consecutive dots.');
    }

    // Domain checks
    if (!domain || !domain.includes('.')) {
      throw new BadRequestException('Please enter a complete email domain (e.g. @gmail.com).');
    }

    // Catch common domain typos
    if (this.TYPO_DOMAIN_MAP[domain]) {
      const suggested = this.TYPO_DOMAIN_MAP[domain];
      throw new BadRequestException(
        `It looks like you typed "@${domain}". Did you mean "@${suggested}"?`
      );
    }

    // Block disposable domains
    if (this.DISPOSABLE_DOMAINS.has(domain)) {
      throw new BadRequestException(
        'Disposable or temporary email domains are not allowed. Please use your personal Gmail or permanent email.'
      );
    }

    // TLD length validation (e.g. .com, .net, .co.uk)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
      throw new BadRequestException('Invalid email top-level domain.');
    }

    return email;
  }

  /**
   * Checks if an email is valid without throwing an exception.
   */
  public static isValid(email: string): boolean {
    try {
      this.validateAndNormalize(email);
      return true;
    } catch {
      return false;
    }
  }
}
