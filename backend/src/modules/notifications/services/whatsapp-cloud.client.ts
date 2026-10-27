import { Injectable, Logger, BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { BangladeshiPhoneUtil } from '../utils/phone-formatter.util';
import {
  WhatsAppSendTemplatePayload,
  WhatsAppSendResponse,
} from '../interfaces/whatsapp.interface';

@Injectable()
export class WhatsAppCloudClient {
  private readonly logger = new Logger(WhatsAppCloudClient.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches a pre-approved HSM transactional template via Meta WhatsApp Cloud API.
   */
  async sendTemplateMessage(payload: WhatsAppSendTemplatePayload): Promise<WhatsAppSendResponse> {
    const rawTo = payload.to;
    if (!BangladeshiPhoneUtil.isValid(rawTo)) {
      throw new BadRequestException(`Invalid recipient phone number for WhatsApp: '${rawTo}'`);
    }

    const internationalPhone = BangladeshiPhoneUtil.toInternationalFormat(rawTo);
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL') || 'https://graph.facebook.com/v20.0';
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    const languageCode = payload.languageCode || 'bn';

    const endpoint = `${apiUrl}/${phoneNumberId}/messages`;

    const requestBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: internationalPhone,
      type: 'template',
      template: {
        name: payload.templateName,
        language: {
          code: languageCode,
        },
        components: payload.components,
      },
    };

    this.logger.debug(
      `[WhatsApp Cloud Client] Dispatching template '${payload.templateName}' to ${internationalPhone}`,
    );

    // Mock Provider handling (for Development, Sandbox & Unit testing)
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';
    if (isTest || !accessToken || accessToken.startsWith('mock_')) {
      const mockWamid = `wamid.HBgM${uuidv4().replace(/-/g, '').substring(0, 24)}==`;
      return {
        success: true,
        messageId: mockWamid,
        recipient: internationalPhone,
        rawResponse: {
          messaging_product: 'whatsapp',
          contacts: [{ input: internationalPhone, wa_id: internationalPhone }],
          messages: [{ id: mockWamid }],
        },
      };
    }

    // Live Meta Graph API HTTP Dispatch
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const metaError = errorJson?.error?.message || response.statusText;
        throw new BadGatewayException(
          `Meta WhatsApp Cloud API error (HTTP ${response.status}): ${metaError}`,
        );
      }

      const data = await response.json();
      const messageId =
        data?.messages?.[0]?.id || `wamid.HBgM${uuidv4().replace(/-/g, '').substring(0, 24)}==`;

      return {
        success: true,
        messageId,
        recipient: internationalPhone,
        rawResponse: data,
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException || err instanceof BadGatewayException) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ [WhatsApp Cloud Client] Transmission failed: ${errorMessage}`);
      throw new BadGatewayException(`WhatsApp Cloud API transmission failed: ${errorMessage}`);
    }
  }
}
