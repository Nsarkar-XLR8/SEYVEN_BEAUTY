import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ResendEmailService } from '../../auth/services/resend-email.service';
import { TelegramNotificationService } from '../services/telegram-notification.service';
import { PrismaService } from '../../../common/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Processor('order-notifications')
export class OrderNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderNotificationProcessor.name);

  constructor(
    @InjectQueue('order-notifications-dlq') private readonly dlqQueue: Queue,
    private readonly resendEmailService: ResendEmailService,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  /**
   * BullMQ Background Worker: Processes order alerts asynchronously in parallel.
   * Completely isolated from customer HTTP thread.
   */
  async process(job: Job<any>): Promise<any> {
    const order = job.data;
    const attempt = job.attemptsMade + 1;
    this.logger.log(
      `⚙️ [BullMQ Worker] Processing notification for Order #${order.orderNumber} (Attempt ${attempt}/3)`,
    );

    // Parallel dispatch with idempotency protection:
    // If an alert succeeded on an earlier attempt, it will not be duplicated.
    const emailAlreadySent = Boolean(order._emailSent);
    const telegramAlreadySent = Boolean(order._telegramSent);

    const emailPromise = emailAlreadySent
      ? Promise.resolve({ success: true, cached: true })
      : this.resendEmailService.sendOrderNotificationEmail(order);

    const telegramPromise = telegramAlreadySent
      ? Promise.resolve(true)
      : this.telegramNotificationService.sendOrderAlert(order);

    const [emailResult, telegramResult] = await Promise.allSettled([
      emailPromise,
      telegramPromise,
    ]);

    const emailSuccess =
      emailAlreadySent ||
      (emailResult.status === 'fulfilled' && (emailResult.value as any)?.success !== false);
    const telegramSuccess =
      telegramAlreadySent ||
      (telegramResult.status === 'fulfilled' && (telegramResult.value as any) !== false);

    // Save success flags to prevent duplicate customer emails on retry
    if (emailSuccess && !emailAlreadySent) {
      order._emailSent = true;
      await job.updateData(order).catch(() => {});
    }
    if (telegramSuccess && !telegramAlreadySent) {
      order._telegramSent = true;
      await job.updateData(order).catch(() => {});
    }

    if (!emailSuccess || !telegramSuccess) {
      const errorReasons: string[] = [];
      if (!emailSuccess) {
        const reason =
          emailResult.status === 'rejected'
            ? (emailResult as PromiseRejectedResult).reason?.message
            : (emailResult.value as any)?.message || 'Email delivery failed';
        errorReasons.push(`Email: ${reason}`);
      }
      if (!telegramSuccess) {
        const reason =
          telegramResult.status === 'rejected'
            ? (telegramResult as PromiseRejectedResult).reason?.message
            : 'Telegram alert failed';
        errorReasons.push(`Telegram: ${reason}`);
      }

      this.logger.warn(
        `⚠️ [BullMQ Worker Notice] Order #${order.orderNumber} incomplete on attempt ${attempt}: ${errorReasons.join(' | ')}. Scheduling retry for uncompleted channel(s).`,
      );

      // Throws error so BullMQ retries the failed channel or moves to DLQ on attempt 3
      throw new Error(errorReasons.join(' | '));
    }

    this.logger.log(`✅ [BullMQ Worker] Successfully dispatched notifications for Order #${order.orderNumber}`);
    return { success: true };
  }

  /**
   * Dead Letter Queue (DLQ) Hook: Triggered when job fails after all 3 retries
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<any> | undefined, error: Error) {
    if (!job) return;

    const maxAttempts = job.opts.attempts || 3;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(
        `❌ [DLQ Triggered] Order #${job.data.orderNumber} exhausted all ${maxAttempts} retry attempts. Routing to Dead Letter Queue. Reason: ${error.message}`,
      );

      try {
        // 1. Move failed payload to Redis Dead Letter Queue
        await this.dlqQueue.add('dead-letter-order-notification', {
          originalJobId: job.id,
          order: job.data,
          error: error.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });

        // 2. Persist audit trail in PostgreSQL
        await this.prisma.systemAuditLog.create({
          data: {
            id: uuidv4(),
            action: 'NOTIFICATION_DLQ_ENQUEUE',
            entityType: 'ORDER',
            entityId: job.data.orderNumber,
            metadata: {
              error: error.message,
              attempts: job.attemptsMade,
              orderData: job.data,
            },
          },
        }).catch((dbErr: any) => this.logger.warn(`Could not persist DLQ audit: ${dbErr?.message || dbErr}`));

        this.logger.log(`📌 [DLQ Safely Committed] Order #${job.data.orderNumber} recorded to DLQ for staff review.`);
      } catch (dlqErr: any) {
        this.logger.error(`Failed to route to DLQ: ${dlqErr.message}`);
      }
    }
  }
}
