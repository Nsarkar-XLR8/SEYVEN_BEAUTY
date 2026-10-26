import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './services/newsletter.service';
import { NewsletterQueueService } from './services/newsletter-queue.service';
import { NewsletterEmailService } from './services/newsletter-email.service';

@Module({
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    NewsletterQueueService,
    NewsletterEmailService,
  ],
  exports: [NewsletterService, NewsletterQueueService],
})
export class NewsletterModule {}
