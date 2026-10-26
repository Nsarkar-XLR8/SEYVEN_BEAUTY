import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { RedisModule } from '../../common/redis/redis.module';
import { SeoController } from './seo.controller';
import { OgGeneratorService } from './services/og-generator.service';
import { RedirectService } from './services/redirect.service';
import { SitemapService } from './services/sitemap.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [SeoController],
  providers: [
    SitemapService,
    OgGeneratorService,
    RedirectService,
  ],
  exports: [
    SitemapService,
    OgGeneratorService,
    RedirectService,
  ],
})
export class SeoModule {}
