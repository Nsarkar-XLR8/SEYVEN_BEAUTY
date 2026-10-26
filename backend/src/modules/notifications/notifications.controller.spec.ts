import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    service = {
      sendDirectSms: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'mock-sms-123',
        recipient: '8801712345678',
      }),
      handleWhatsAppWebhook: jest.fn().mockResolvedValue({
        processed: true,
        updatedStatuses: 1,
      }),
      listLogs: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return 'valid_token_123';
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: service },
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /admin/notifications/sms/send', () => {
    it('should delegate to notificationsService.sendDirectSms', async () => {
      const dto = { to: '01712345678', message: 'Test message', isUrgent: false };
      const res = await controller.sendDirectSms(dto);

      expect(service.sendDirectSms).toHaveBeenCalledWith(dto);
      expect(res.success).toBe(true);
      expect(res.messageId).toBe('mock-sms-123');
    });
  });

  describe('GET /webhooks/whatsapp', () => {
    it('should echo challenge string when verify_token matches', () => {
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      controller.verifyWhatsAppWebhook(
        {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'valid_token_123',
          'hub.challenge': '115599',
        },
        mockRes,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('115599');
    });

    it('should throw ForbiddenException when verify_token does not match', () => {
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      expect(() =>
        controller.verifyWhatsAppWebhook(
          {
            'hub.mode': 'subscribe',
            'hub.verify_token': 'invalid_token',
            'hub.challenge': '115599',
          },
          mockRes,
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('POST /webhooks/whatsapp', () => {
    it('should delegate webhook payload to notificationsService.handleWhatsAppWebhook', async () => {
      const payload: any = { object: 'whatsapp_business_account', entry: [] };
      const res = await controller.handleWhatsAppWebhook(payload);

      expect(service.handleWhatsAppWebhook).toHaveBeenCalledWith(payload);
      expect(res.processed).toBe(true);
    });
  });

  describe('GET /admin/notifications/logs', () => {
    it('should delegate to notificationsService.listLogs', async () => {
      const query = { page: 1, limit: 10 };
      const res = await controller.listLogs(query as any);

      expect(service.listLogs).toHaveBeenCalledWith(query);
      expect(res.items).toEqual([]);
    });
  });
});
