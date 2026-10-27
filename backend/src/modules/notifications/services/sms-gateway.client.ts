import { Injectable, Logger, BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { BangladeshiPhoneUtil } from '../utils/phone-formatter.util';
import {
  SmsProvider,
  SmsSendPayload,
  SmsSendResponse,
} from '../interfaces/sms.interface';

@Injectable()
export class SmsGatewayClient {
  private readonly logger = new Logger(SmsGatewayClient.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches an SMS via the configured BTRC-approved masked gateway.
   */
  async sendSms(payload: SmsSendPayload): Promise<SmsSendResponse> {
    const rawTo = payload.to;
    if (!BangladeshiPhoneUtil.isValid(rawTo)) {
      throw new BadRequestException(`Invalid Bangladeshi mobile phone number '${rawTo}'`);
    }

    const internationalPhone = BangladeshiPhoneUtil.toInternationalFormat(rawTo);
    const senderMask = this.configService.get<string>('SMS_SENDER_MASK') || 'SEYVEN';
    const provider =
      (this.configService.get<string>('SMS_GATEWAY_PROVIDER') as SmsProvider) ||
      SmsProvider.MOCK;
    const apiUrl =
      this.configService.get<string>('SMS_GATEWAY_API_URL') ||
      'https://api.sms-gateway.bd/v1/send';
    const apiKey = this.configService.get<string>('SMS_GATEWAY_API_KEY') || '';

    const { charCount, parts, isUnicode } = this.calculateSmsParts(payload.message);

    this.logger.debug(
      `[SMS Client] Dispatching SMS via ${provider} | Mask: ${senderMask} | To: ${internationalPhone} | Parts: ${parts} (${charCount} chars, Unicode: ${isUnicode})`,
    );

    // Mock Provider handling (for Development, Sandbox & Unit/E2E testing)
    if (provider === SmsProvider.MOCK || this.configService.get<string>('NODE_ENV') === 'test') {
      const mockMessageId = `mock-sms-${uuidv4().substring(0, 8)}`;
      return {
        success: true,
        messageId: mockMessageId,
        recipient: internationalPhone,
        senderMask,
        charCount,
        parts,
        provider: SmsProvider.MOCK,
        rawResponse: { status: 'SUCCESS', statusCode: 200, messageId: mockMessageId },
      };
    }

    // Live HTTP dispatch for Bangladesh SMS Aggregators (Greenweb, Reve, SSL Wireless)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          senderid: senderMask,
          number: internationalPhone,
          message: payload.message,
          type: isUnicode ? 'unicode' : 'text',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadGatewayException(
          `SMS gateway responded with HTTP ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json().catch(() => ({}));
      const messageId = data?.message_id || data?.msg_id || `sms-${uuidv4().substring(0, 8)}`;

      return {
        success: true,
        messageId,
        recipient: internationalPhone,
        senderMask,
        charCount,
        parts,
        provider,
        rawResponse: data,
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException || err instanceof BadGatewayException) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ [SMS Client] Gateway transmission failed: ${errorMessage}`);
      throw new BadGatewayException(`SMS Gateway transmission failed: ${errorMessage}`);
    }
  }

  /**
   * Calculates SMS character count and concatenated part count.
   * Standard GSM-7: 160 chars (1 part) or 153 chars/part (multi-part).
   * Unicode (e.g. Bangla): 70 chars (1 part) or 67 chars/part (multi-part).
   */
  calculateSmsParts(message: string): { charCount: number; parts: number; isUnicode: boolean } {
    const isUnicode = /[^\u0000-\u00ff]/.test(message);
    const charCount = message.length;

    let parts = 1;
    if (isUnicode) {
      if (charCount > 70) {
        parts = Math.ceil(charCount / 67);
      }
    } else {
      if (charCount > 160) {
        parts = Math.ceil(charCount / 153);
      }
    }

    return { charCount, parts, isUnicode };
  }
}
