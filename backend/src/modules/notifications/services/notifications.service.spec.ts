import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { SmsGatewayClient } from './sms-gateway.client';
import { WhatsAppCloudClient } from './whatsapp-cloud.client';
import { QuietHoursManager } from './quiet-hours.manager';
import { NotificationChannel, NotificationStatus } from '../interfaces/notification.interface';
import { SmsProvider } from '../interfaces/sms.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let smsGatewayClient: jest.Mocked<SmsGatewayClient>;
  let whatsAppCloudClient: jest.Mocked<WhatsAppCloudClient>;
  let quietHoursManager: jest.Mocked<QuietHoursManager>;

  beforeEach(async () => {
    prisma = {
      notificationLog: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-1', ...args.data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'log-1', providerMessageId: 'wamid-123' }),
        update: jest.fn().mockResolvedValue({ id: 'log-1', status: NotificationStatus.DELIVERED }),
        findMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    smsGatewayClient = {
      sendSms: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'mock-sms-1',
        recipient: '8801712345678',
        senderMask: 'SEYVEN',
        charCount: 20,
        parts: 1,
        provider: SmsProvider.MOCK,
      }),
    } as any;

    whatsAppCloudClient = {
      sendTemplateMessage: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'wamid.HBgM123==',
        recipient: '8801712345678',
      }),
    } as any;

    quietHoursManager = {
      canDispatchImmediately: jest.fn().mockReturnValue({ allowed: true }),
      checkQuietHours: jest.fn().mockReturnValue({ isQuietHour: false }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SmsGatewayClient, useValue: smsGatewayClient },
        { provide: WhatsAppCloudClient, useValue: whatsAppCloudClient },
        { provide: QuietHoursManager, useValue: quietHoursManager },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendDirectSms', () => {
    it('should dispatch SMS and write to notification log when within active hours', async () => {
      const res = await service.sendDirectSms({
        to: '01712345678',
        message: 'Hello customer',
        isUrgent: false,
      });

      expect(res.success).toBe(true);
      expect(smsGatewayClient.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({ to: '8801712345678' }),
      );
      expect(prisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.SMS,
            status: NotificationStatus.SENT,
          }),
        }),
      );
    });

    it('should suppress and log as SUPPRESSED_QUIET_HOURS when quiet hours active and not urgent', async () => {
      quietHoursManager.canDispatchImmediately.mockReturnValue({
        allowed: false,
        reason: 'BTRC quiet hours 10 PM - 8 AM BST',
      });

      const res = await service.sendDirectSms({
        to: '01712345678',
        message: 'Promotional discount',
        isUrgent: false,
      });

      expect(res.success).toBe(false);
      expect(res.suppressed).toBe(true);
      expect(smsGatewayClient.sendSms).not.toHaveBeenCalled();
      expect(prisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: NotificationStatus.SUPPRESSED_QUIET_HOURS,
          }),
        }),
      );
    });
  });

  describe('sendWhatsAppTemplate', () => {
    it('should dispatch WhatsApp HSM template and log to notification_logs', async () => {
      const res = await service.sendWhatsAppTemplate({
        to: '01712345678',
        templateName: 'seyven_order_confirmed',
        components: [],
      });

      expect(res.success).toBe(true);
      expect(whatsAppCloudClient.sendTemplateMessage).toHaveBeenCalledWith(
        expect.objectContaining({ to: '8801712345678' }),
      );
      expect(prisma.notificationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channel: NotificationChannel.WHATSAPP,
            status: NotificationStatus.SENT,
          }),
        }),
      );
    });
  });

  describe('handleWhatsAppWebhook', () => {
    it('should update log status to DELIVERED when receipt is delivered', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'wa-entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '123', phone_number_id: '456' },
                  statuses: [
                    {
                      id: 'wamid-123',
                      status: 'delivered' as const,
                      timestamp: '1729000000',
                      recipient_id: '8801712345678',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await service.handleWhatsAppWebhook(webhookPayload);
      expect(result.processed).toBe(true);
      expect(result.updatedStatuses).toBe(1);
      expect(prisma.notificationLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: NotificationStatus.DELIVERED }),
        }),
      );
    });
  });

  describe('Transactional notification helpers', () => {
    it('sendOtpNotification should send SMS with isUrgent=true', async () => {
      const spy = jest.spyOn(service, 'sendDirectSms').mockResolvedValue({
        success: true,
        messageId: 'mock-sms-otp',
        logId: 'log-otp',
        recipient: '8801712345678',
      });

      await service.sendOtpNotification('01712345678', '998877', 5);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          isUrgent: true,
          templateName: 'OTP_VERIFICATION',
          message: expect.stringContaining('998877'),
        }),
      );
    });

    it('sendOrderPlacedNotification should dispatch both SMS and WhatsApp', async () => {
      jest.spyOn(service, 'sendDirectSms').mockResolvedValue({ success: true } as any);
      jest.spyOn(service, 'sendWhatsAppTemplate').mockResolvedValue({ success: true } as any);

      const order = {
        id: 'ord-101',
        orderNumber: 'SYV-101',
        guestPhone: '01712345678',
        guestName: 'Zubair',
        totalPayableBdt: 4500,
      };

      const res = await service.sendOrderPlacedNotification(order);
      expect(res.sms.success).toBe(true);
      expect(res.whatsapp.success).toBe(true);
    });

    it('sendOrderDispatchedNotification should dispatch with tracking code', async () => {
      jest.spyOn(service, 'sendDirectSms').mockResolvedValue({ success: true } as any);
      jest.spyOn(service, 'sendWhatsAppTemplate').mockResolvedValue({ success: true } as any);

      const order = {
        id: 'ord-102',
        orderNumber: 'SYV-102',
        guestPhone: '01712345678',
        courier: 'PATHAO',
        trackingCode: 'PTH-992211',
      };

      const res = await service.sendOrderDispatchedNotification(order);
      expect(res.sms.success).toBe(true);
      expect(res.whatsapp.success).toBe(true);
    });

    it('sendOrderDeliveredNotification should dispatch delivery notice', async () => {
      jest.spyOn(service, 'sendDirectSms').mockResolvedValue({ success: true } as any);
      jest.spyOn(service, 'sendWhatsAppTemplate').mockResolvedValue({ success: true } as any);

      const order = {
        id: 'ord-103',
        orderNumber: 'SYV-103',
        guestPhone: '01712345678',
      };

      const res = await service.sendOrderDeliveredNotification(order);
      expect(res.sms.success).toBe(true);
      expect(res.whatsapp.success).toBe(true);
    });
  });

  describe('listLogs', () => {
    it('should return paginated audit logs', async () => {
      const res = await service.listLogs({ page: 1, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.totalPages).toBe(1);
      expect(prisma.notificationLog.findMany).toHaveBeenCalled();
    });
  });
});
