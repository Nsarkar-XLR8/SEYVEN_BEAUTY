export enum WhatsAppTemplateName {
  ORDER_CONFIRMED = 'seyven_order_confirmed',
  ORDER_DISPATCHED = 'seyven_order_dispatched',
  ORDER_DELIVERED = 'seyven_order_delivered',
  OTP_VERIFICATION = 'seyven_otp_verification',
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: number;
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppSendTemplatePayload {
  to: string; // E.164 formatted without '+' e.g., '8801712345678'
  templateName: WhatsAppTemplateName | string;
  languageCode?: string; // default: 'bn' or 'en'
  components: WhatsAppTemplateComponent[];
  metadata?: Record<string, any>;
}

export interface WhatsAppSendResponse {
  success: boolean;
  messageId: string; // Meta WhatsApp wamid.HBg...
  recipient: string;
  rawResponse?: Record<string, any>;
}

export interface WhatsAppWebhookStatusUpdate {
  id: string; // wamid
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: Record<string, any>;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses?: WhatsAppWebhookStatusUpdate[];
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}
