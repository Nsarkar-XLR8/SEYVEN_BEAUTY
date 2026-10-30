import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { SmsGatewayClient } from './services/sms-gateway.client';
import { WhatsAppCloudClient } from './services/whatsapp-cloud.client';
import { QuietHoursManager } from './services/quiet-hours.manager';
import { TelegramNotificationService } from './services/telegram-notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { OrderNotificationProcessor } from './processors/order-notification.processor';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'order-notifications',
    }),
    BullModule.registerQueue({
      name: 'order-notifications-dlq',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    SmsGatewayClient,
    WhatsAppCloudClient,
    QuietHoursManager,
    TelegramNotificationService,
    NotificationQueueService,
    OrderNotificationProcessor,
  ],
  exports: [
    NotificationsService,
    SmsGatewayClient,
    WhatsAppCloudClient,
    QuietHoursManager,
    TelegramNotificationService,
    NotificationQueueService,
  ],
})
export class NotificationsModule {}
