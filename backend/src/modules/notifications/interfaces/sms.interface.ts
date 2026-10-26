export enum SmsProvider {
  MOCK = 'MOCK',
  GREENWEB = 'GREENWEB',
  REVE = 'REVE',
  SSL_WIRELESS = 'SSL_WIRELESS',
}

export interface SmsSendPayload {
  to: string; // Recipient phone number (e.g., +8801712345678, 01712345678)
  message: string;
  isUrgent?: boolean; // If true, exempt from quiet hours (e.g., OTP)
  metadata?: Record<string, any>;
}

export interface SmsSendResponse {
  success: boolean;
  messageId: string;
  recipient: string;
  senderMask: string;
  charCount: number;
  parts: number;
  provider: SmsProvider;
  rawResponse?: Record<string, any>;
}

export interface QuietHoursCheckResult {
  isQuietHour: boolean;
  currentBstHour: number;
  currentBstMinute: number;
  nextAllowedWindowAt: Date;
}
