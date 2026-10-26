import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../common/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { SmsGatewayClient } from './services/sms-gateway.client';
import { WhatsAppCloudClient } from './services/whatsapp-cloud.client';
import { QuietHoursManager } from './services/quiet-hours.manager';
import { TelegramNotificationService } from './services/telegram-notification.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    SmsGatewayClient,
    WhatsAppCloudClient,
    QuietHoursManager,
    TelegramNotificationService,
  ],
  exports: [
    NotificationsService,
    SmsGatewayClient,
    WhatsAppCloudClient,
    QuietHoursManager,
    TelegramNotificationService,
  ],
})
export class NotificationsModule {}
