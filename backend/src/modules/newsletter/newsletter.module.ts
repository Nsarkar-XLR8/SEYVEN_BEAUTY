import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './services/newsletter.service';
import { NewsletterQueueService } from './services/newsletter-queue.service';
import { NewsletterEmailService } from './services/newsletter-email.service';

@Module({
  imports: [SettingsModule],
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    NewsletterQueueService,
    NewsletterEmailService,
  ],
  exports: [NewsletterService, NewsletterQueueService],
})
export class NewsletterModule {}
