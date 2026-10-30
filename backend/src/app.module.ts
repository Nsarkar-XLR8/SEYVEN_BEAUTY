import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SearchModule } from './modules/search/search.module';

import { RedisModule } from './common/redis/redis.module';

import { CartModule } from './modules/cart/cart.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CourierModule } from './modules/courier/courier.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RmaModule } from './modules/rma/rma.module';
import { CustomerModule } from './modules/customer/customer.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { SeoModule } from './modules/seo/seo.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    AppConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') || process.env.REDIS_URL;
        if (redisUrl && redisUrl.trim()) {
          try {
            const parsed = new URL(redisUrl);
            const isTls = parsed.protocol === 'rediss:' || redisUrl.includes('upstash.io');
            return {
              connection: {
                host: parsed.hostname,
                port: Number(parsed.port) || 6379,
                username: parsed.username || 'default',
                password: parsed.password || undefined,
                tls: isTls ? { rejectUnauthorized: false } : undefined,
                maxRetriesPerRequest: null,
                enableReadyCheck: false,
              },
            };
          } catch {}
        }
        return {
          connection: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            password: config.get<string>('REDIS_PASSWORD') || undefined,
            tls: config.get<string>('REDIS_TLS') === 'true' ? { rejectUnauthorized: false } : undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
        };
      },
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    JobsModule,
    AuthModule,
    CatalogModule,
    InventoryModule,
    SearchModule,
    CartModule,
    PromotionsModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    CourierModule,
    NotificationsModule,
    AnalyticsModule,
    RmaModule,
    CustomerModule,
    LoyaltyModule,
    SeoModule,
    NewsletterModule,
    SettingsModule,
  ],
})
export class AppModule {}

