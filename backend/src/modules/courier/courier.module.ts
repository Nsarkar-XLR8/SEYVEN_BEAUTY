import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { SettingsModule } from '../settings/settings.module';
import { CourierController } from './courier.controller';
import { PathaoService } from './services/pathao.service';
import { PathaoApiClient } from './services/pathao-api.client';
import { PathaoBookingWorker } from './workers/pathao-booking.worker';
import { PathaoWebhookGuard } from './guards/pathao-webhook.guard';

import { SteadfastService } from './services/steadfast.service';
import { SteadfastApiClient } from './services/steadfast-api.client';
import { SteadfastBookingWorker } from './workers/steadfast-booking.worker';
import { SteadfastWebhookGuard } from './guards/steadfast-webhook.guard';
import { CourierRoutingService } from './services/courier-routing.service';
import { LogisticsService } from './services/logistics.service';

@Module({
  imports: [ConfigModule, DatabaseModule, RedisModule, SettingsModule],
  controllers: [CourierController],
  providers: [
    // Logistics & Geographic Resolver
    LogisticsService,
    // Pathao (Primary Courier)
    PathaoApiClient,
    PathaoBookingWorker,
    PathaoService,
    PathaoWebhookGuard,
    // Steadfast (Backup Courier)
    SteadfastApiClient,
    SteadfastBookingWorker,
    SteadfastService,
    SteadfastWebhookGuard,
    // Smart Router (Pathao 1st, Steadfast Backup)
    CourierRoutingService,
  ],
  exports: [
    LogisticsService,
    PathaoService,
    PathaoApiClient,
    PathaoBookingWorker,
    SteadfastService,
    SteadfastApiClient,
    SteadfastBookingWorker,
    CourierRoutingService,
  ],
})
export class CourierModule {}

