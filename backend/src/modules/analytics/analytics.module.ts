import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DeduplicationService } from './services/deduplication.service';
import { MetaCapiClient } from './services/meta-capi.client';
import { MetaCapiWorker } from './workers/meta-capi.worker';
import { Ga4Client } from './services/ga4.client';
import { AttributionService } from './services/attribution.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    DeduplicationService,
    MetaCapiClient,
    MetaCapiWorker,
    Ga4Client,
    AttributionService,
  ],
  exports: [
    AnalyticsService,
    DeduplicationService,
    MetaCapiClient,
    MetaCapiWorker,
    Ga4Client,
    AttributionService,
  ],
})
export class AnalyticsModule {}
