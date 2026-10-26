import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { NewsletterEmailService } from './newsletter-email.service';
import {
  DeadLetterQueueItem,
  NewsletterDispatchJob,
} from '../interfaces/newsletter.interface';

@Injectable()
export class NewsletterQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsletterQueueService.name);

  // In-memory queue storage with retry & DLQ guarantees
  private primaryQueue: NewsletterDispatchJob[] = [];
  private deadLetterQueue: Map<string, DeadLetterQueueItem> = new Map();
  private isProcessing = false;
  private workerInterval: NodeJS.Timeout | null = null;

  // Maximum retry attempts before routing to Dead Letter Queue (DLQ)
  private readonly MAX_ATTEMPTS = 3;

  constructor(private readonly emailService: NewsletterEmailService) {}

  onModuleInit() {
    this.logger.log('📬 [NewsletterQueueService] Initialized with Dead Letter Queue (DLQ) support.');
    // Start worker loop to process jobs asynchronously
    this.workerInterval = setInterval(() => {
      this.processNextBatch();
    }, 1000);
  }

  onModuleDestroy() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
    }
  }

  /**
   * Enqueues an array of newsletter dispatch jobs into the primary queue.
   */
  async enqueueBatch(jobs: NewsletterDispatchJob[]): Promise<{ queuedCount: number }> {
    for (const job of jobs) {
      this.primaryQueue.push(job);
    }
    this.logger.log(`📥 [Newsletter Queue] Enqueued ${jobs.length} dispatch jobs into primary queue. Pending: ${this.primaryQueue.length}`);
    return { queuedCount: jobs.length };
  }

  /**
   * Worker loop: processes jobs in batches of up to 5 at a time.
   */
  private async processNextBatch() {
    if (this.isProcessing || this.primaryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batchSize = Math.min(5, this.primaryQueue.length);
    const currentBatch = this.primaryQueue.splice(0, batchSize);

    try {
      await Promise.all(
        currentBatch.map(async (job) => {
          await this.executeJobWithRetryAndDlq(job);
        }),
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executes a job. If dispatch fails, handles retries with backoff.
   * If max retries exceeded, routes job to the Dead Letter Queue (DLQ).
   */
  private async executeJobWithRetryAndDlq(job: NewsletterDispatchJob) {
    job.attemptCount += 1;

    try {
      this.logger.debug(`⚡ [Newsletter Worker] Dispatching job ${job.id} to ${job.recipientEmail} (Attempt ${job.attemptCount}/${this.MAX_ATTEMPTS})`);

      const result = await this.emailService.sendEmail({
        toEmail: job.recipientEmail,
        recipientName: job.recipientName,
        subject: job.subject,
        previewText: job.previewText,
        contentHtml: job.contentHtml,
        discountCode: job.discountCode,
        discountBanner: job.discountBanner,
        unsubscribeToken: job.unsubscribeToken,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to dispatch email via email gateway');
      }

      this.logger.log(`✅ [Newsletter Worker] Job ${job.id} successfully delivered to ${job.recipientEmail}`);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      this.logger.warn(`⚠️ [Newsletter Worker] Job ${job.id} failed on attempt ${job.attemptCount}: ${errorMsg}`);

      if (job.attemptCount < this.MAX_ATTEMPTS) {
        // Re-queue for next retry with slight delay
        setTimeout(() => {
          this.primaryQueue.push(job);
        }, job.attemptCount * 2000);
      } else {
        // Max retries exceeded -> Route to Dead Letter Queue (DLQ)
        this.routeToDeadLetterQueue(job, errorMsg);
      }
    }
  }

  /**
   * Routes a poisoned / repeatedly failing job to the Dead Letter Queue.
   */
  private routeToDeadLetterQueue(job: NewsletterDispatchJob, errorMessage: string) {
    const dlqItem: DeadLetterQueueItem = {
      id: uuidv4(),
      jobId: job.id,
      campaignId: job.campaignId,
      recipientEmail: job.recipientEmail,
      subject: job.subject,
      attemptCount: job.attemptCount,
      errorMessage,
      failedAt: new Date(),
      payload: job,
    };

    this.deadLetterQueue.set(dlqItem.id, dlqItem);
    this.logger.error(`🚨 [DEAD LETTER QUEUE] Job ${job.id} routed to DLQ! Recipient: ${job.recipientEmail}, Error: ${errorMessage}`);
  }

  /**
   * Retrieves all items currently waiting in the Dead Letter Queue.
   */
  getDeadLetterQueueItems(): DeadLetterQueueItem[] {
    return Array.from(this.deadLetterQueue.values()).sort(
      (a, b) => b.failedAt.getTime() - a.failedAt.getTime(),
    );
  }

  /**
   * Re-drives (retries) a specific item from the Dead Letter Queue.
   */
  reDriveDlqItem(dlqId: string): { success: boolean; message: string } {
    const item = this.deadLetterQueue.get(dlqId);
    if (!item) {
      return { success: false, message: `DLQ item with ID ${dlqId} not found.` };
    }

    // Reset attempt count and push back to primary queue
    item.payload.attemptCount = 0;
    this.primaryQueue.unshift(item.payload);
    this.deadLetterQueue.delete(dlqId);

    this.logger.log(`🔄 [DLQ Redrive] Re-queued DLQ item ${dlqId} for recipient ${item.recipientEmail}`);
    return { success: true, message: `Job for ${item.recipientEmail} re-queued from Dead Letter Queue.` };
  }

  /**
   * Re-drives all items currently in the Dead Letter Queue.
   */
  reDriveAllDlq(): { reDrivenCount: number } {
    const items = Array.from(this.deadLetterQueue.values());
    for (const item of items) {
      item.payload.attemptCount = 0;
      this.primaryQueue.push(item.payload);
      this.deadLetterQueue.delete(item.id);
    }

    this.logger.log(`🔄 [DLQ Redrive All] Re-queued ${items.length} items from Dead Letter Queue.`);
    return { reDrivenCount: items.length };
  }

  /**
   * Clears all items in the Dead Letter Queue.
   */
  clearDeadLetterQueue(): { clearedCount: number } {
    const count = this.deadLetterQueue.size;
    this.deadLetterQueue.clear();
    return { clearedCount: count };
  }

  /**
   * Returns queue health and metrics.
   */
  getQueueMetrics() {
    return {
      primaryQueuePending: this.primaryQueue.length,
      deadLetterQueueCount: this.deadLetterQueue.size,
      isProcessing: this.isProcessing,
      maxAttemptsAllowed: this.MAX_ATTEMPTS,
    };
  }
}
