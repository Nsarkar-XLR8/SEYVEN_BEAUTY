import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { SmsGatewayClient } from './sms-gateway.client';
import { WhatsAppCloudClient } from './whatsapp-cloud.client';
import { QuietHoursManager } from './quiet-hours.manager';
import { BangladeshiPhoneUtil } from '../utils/phone-formatter.util';
import { SendDirectSmsDto } from '../dto/send-direct-sms.dto';
import { NotificationQueryDto } from '../dto/notification-query.dto';
import {
  WhatsAppSendTemplatePayload,
  WhatsAppTemplateName,
  WhatsAppWebhookPayload,
} from '../interfaces/whatsapp.interface';
import { NotificationChannel, NotificationStatus } from '../interfaces/notification.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsGatewayClient: SmsGatewayClient,
    private readonly whatsAppCloudClient: WhatsAppCloudClient,
    private readonly quietHoursManager: QuietHoursManager,
  ) {}

  /**
   * Direct SMS dispatch with BTRC quiet-hours enforcement and audit logging
   * (Currently paused per luxury English unification policy)
   */
  async sendDirectSms(dto: SendDirectSmsDto) {
    if (!BangladeshiPhoneUtil.isValid(dto.to)) {
      throw new BadRequestException(`Invalid Bangladeshi mobile phone number: '${dto.to}'`);
    }

    const internationalPhone = BangladeshiPhoneUtil.toInternationalFormat(dto.to);
    this.logger.log(`[SMS Paused] SMS dispatch suppressed for ${internationalPhone}`);
    return {
      success: true,
      suppressed: true,
      recipient: internationalPhone,
      messageId: `paused-${Date.now()}`,
      logId: `paused-${Date.now()}`,
      reason: 'SMS service is temporarily paused.',
    };
  }

  /**
   * Dispatch pre-approved HSM WhatsApp transactional template
   */
  async sendWhatsAppTemplate(payload: WhatsAppSendTemplatePayload) {
    if (!BangladeshiPhoneUtil.isValid(payload.to)) {
      throw new BadRequestException(`Invalid Bangladeshi mobile phone number for WhatsApp: '${payload.to}'`);
    }

    const internationalPhone = BangladeshiPhoneUtil.toInternationalFormat(payload.to);
    const templateName = payload.templateName;

    try {
      const response = await this.whatsAppCloudClient.sendTemplateMessage({
        ...payload,
        to: internationalPhone,
      });

      const log = await (this.prisma as any).notificationLog.create({
        data: {
          id: uuidv4(),
          channel: NotificationChannel.WHATSAPP,
          recipientPhone: internationalPhone,
          templateName,
          status: NotificationStatus.SENT,
          messageBody: `WhatsApp Template: ${templateName}`,
          providerMessageId: response.messageId,
          sentAt: new Date(),
          metadata: {
            ...payload.metadata,
            components: payload.components,
          },
        },
      });

      return {
        success: true,
        messageId: response.messageId,
        logId: log.id,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await (this.prisma as any).notificationLog.create({
        data: {
          id: uuidv4(),
          channel: NotificationChannel.WHATSAPP,
          recipientPhone: internationalPhone,
          templateName,
          status: NotificationStatus.FAILED,
          messageBody: `WhatsApp Template: ${templateName}`,
          failureReason: errorMessage,
          metadata: payload.metadata,
        },
      });

      throw err;
    }
  }

  /**
   * Handle incoming Meta WhatsApp Cloud webhook delivery receipts
   */
  async handleWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
    const entries = payload.entry || [];
    let updatedCount = 0;

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          const wamid = status.id;
          const statusValue = status.status;
          const timestamp = status.timestamp
            ? new Date(Number(status.timestamp) * 1000)
            : new Date();

          let notificationStatus: NotificationStatus = NotificationStatus.SENT;
          if (statusValue === 'delivered') notificationStatus = NotificationStatus.DELIVERED;
          else if (statusValue === 'failed') notificationStatus = NotificationStatus.FAILED;

          const existingLog = await (this.prisma as any).notificationLog.findFirst({
            where: { providerMessageId: wamid },
          });

          if (existingLog) {
            const failureReason =
              status.errors && status.errors.length > 0
                ? `${status.errors[0].title}: ${status.errors[0].message}`
                : existingLog.failureReason;

            await (this.prisma as any).notificationLog.update({
              where: { id: existingLog.id },
              data: {
                status: notificationStatus,
                deliveredAt: statusValue === 'delivered' ? timestamp : existingLog.deliveredAt,
                failureReason,
                updatedAt: new Date(),
              },
            });
            updatedCount++;
          }
        }
      }
    }

    return { processed: true, updatedStatuses: updatedCount };
  }

  // ========================================================
  // TRANSACTIONAL NOTIFICATION PIPELINE HELPERS
  // ========================================================

  /**
   * Transactional OTP verification SMS (Decommissioned per policy)
   */
  async sendOtpNotification(phone: string, otpCode: string, validityMinutes = 5) {
    this.logger.log(`[OTP Deactivated] OTP dispatch suppressed for ${phone}`);
    return {
      success: true,
      suppressed: true,
      recipient: phone,
      messageId: `paused-${Date.now()}`,
      logId: `paused-${Date.now()}`,
      reason: 'OTP service is deactivated.',
    };
  }

  /**
   * Order Placed notification (English luxury transactional notification)
   */
  async sendOrderPlacedNotification(order: {
    id: string;
    orderNumber: string;
    guestPhone: string;
    guestName: string;
    totalPayableBdt: number;
  }) {
    const smsMessage = `SEYVEN: Dear ${order.guestName}, your order #${order.orderNumber} (৳${order.totalPayableBdt.toFixed(2)}) has been confirmed. Track: theseyven.com/track-order?id=${order.orderNumber}`;

    // 1. Send SMS
    const smsResult = await this.sendDirectSms({
      to: order.guestPhone,
      message: smsMessage,
      isUrgent: false,
      templateName: 'ORDER_PLACED',
    }).catch((err) => {
      this.logger.warn(`Order Placed SMS failed: ${err.message}`);
      return { success: false, error: err.message };
    });

    // 2. Send WhatsApp HSM Template
    const waResult = await this.sendWhatsAppTemplate({
      to: order.guestPhone,
      templateName: WhatsAppTemplateName.ORDER_CONFIRMED,
      languageCode: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.guestName },
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: `৳${order.totalPayableBdt.toFixed(2)}` },
          ],
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    }).catch((err) => {
      this.logger.warn(`Order Placed WhatsApp failed: ${err.message}`);
      return { success: false, error: err.message };
    });

    return { sms: smsResult, whatsapp: waResult };
  }

  /**
   * Order Dispatched notification with tracking link
   */
  async sendOrderDispatchedNotification(order: {
    id: string;
    orderNumber: string;
    guestPhone: string;
    courier: string;
    trackingCode: string;
  }) {
    const smsMessage = `SEYVEN: Your order #${order.orderNumber} has been dispatched via ${order.courier}. Tracking Code: ${order.trackingCode}`;

    const smsResult = await this.sendDirectSms({
      to: order.guestPhone,
      message: smsMessage,
      isUrgent: false,
      templateName: 'ORDER_DISPATCHED',
    }).catch((err) => ({ success: false, error: err.message }));

    const waResult = await this.sendWhatsAppTemplate({
      to: order.guestPhone,
      templateName: WhatsAppTemplateName.ORDER_DISPATCHED,
      languageCode: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: order.courier },
            { type: 'text', text: order.trackingCode },
          ],
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    }).catch((err) => ({ success: false, error: err.message }));

    return { sms: smsResult, whatsapp: waResult };
  }

  /**
   * Order Delivered notification
   */
  async sendOrderDeliveredNotification(order: {
    id: string;
    orderNumber: string;
    guestPhone: string;
  }) {
    const smsMessage = `SEYVEN: Your parcel #${order.orderNumber} has been delivered. Thank you for choosing Seyven Luxury Skincare.`;

    const smsResult = await this.sendDirectSms({
      to: order.guestPhone,
      message: smsMessage,
      isUrgent: false,
      templateName: 'ORDER_DELIVERED',
    }).catch((err) => ({ success: false, error: err.message }));

    const waResult = await this.sendWhatsAppTemplate({
      to: order.guestPhone,
      templateName: WhatsAppTemplateName.ORDER_DELIVERED,
      languageCode: 'en',
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: order.orderNumber }],
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    }).catch((err) => ({ success: false, error: err.message }));

    return { sms: smsResult, whatsapp: waResult };
  }

  /**
   * Paginated audit log retrieval for admin dashboard
   */
  async listLogs(query: NotificationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;
    if (query.templateName) where.templateName = { contains: query.templateName, mode: 'insensitive' };
    if (query.phone) where.recipientPhone = { contains: query.phone };

    const [items, total] = await Promise.all([
      (this.prisma as any).notificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).notificationLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
