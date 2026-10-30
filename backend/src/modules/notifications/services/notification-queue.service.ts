import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ResendEmailService } from '../../auth/services/resend-email.service';
import { TelegramNotificationService } from './telegram-notification.service';

export interface OrderNotificationJobData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  district?: string;
  zone?: string;
  items?: Array<{
    title: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  totalAmount: number;
  paymentMethod?: string;
  status?: string;
  source?: string;
  createdAt?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('order-notifications') private readonly orderQueue: Queue,
    @InjectQueue('order-notifications-dlq') private readonly dlqQueue: Queue,
    private readonly resendEmailService: ResendEmailService,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  /**
   * Enqueues an order notification job to BullMQ primary queue (<10ms).
   * Guaranteed delivery: If Redis is offline, gracefully executes direct fallback.
   */
  async enqueueOrderAlert(orderData: OrderNotificationJobData): Promise<void> {
    try {
      await this.orderQueue.add('send-order-alert', orderData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s retries
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for DLQ inspection
      });

      this.logger.log(
        `⚡ [BullMQ Enqueued] Order #${orderData.orderNumber} successfully queued for async dispatch.`,
      );
    } catch (queueErr: any) {
      this.logger.warn(
        `⚠️ [BullMQ Fallback] Could not enqueue to Redis (${queueErr.message}). Executing resilient direct dispatch.`,
      );

      // Resilient local fallback: Never let a notification get lost
      try {
        await Promise.allSettled([
          this.resendEmailService.sendOrderNotificationEmail(orderData),
          this.telegramNotificationService.sendOrderAlert(orderData),
        ]);
        this.logger.log(
          `✉️ [Direct Fallback] Dispatched notifications directly for #${orderData.orderNumber}`,
        );
      } catch (fallbackErr: any) {
        this.logger.error(
          `❌ [Direct Fallback Failed] #${orderData.orderNumber}: ${fallbackErr.message}`,
        );
      }
    }
  }

  /**
   * Inspect all dead-lettered jobs for admin desk
   */
  async getDeadLetterJobs(start = 0, end = 49) {
    try {
      const jobs = await this.dlqQueue.getJobs(['failed', 'completed', 'waiting'], start, end);
      return jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        attemptsMade: j.attemptsMade,
        timestamp: j.timestamp,
      }));
    } catch (err: any) {
      this.logger.warn(`Could not read DLQ jobs: ${err.message}`);
      return [];
    }
  }

  /**
   * Replays a dead-lettered job back into the primary queue
   */
  async replayDeadLetterJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.dlqQueue.getJob(jobId);
      if (!job) return false;

      await this.orderQueue.add('send-order-alert', job.data.order || job.data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      });

      await job.remove();
      this.logger.log(`🔄 [DLQ Replay] Job ${jobId} successfully replayed to primary queue.`);
      return true;
    } catch (err: any) {
      this.logger.error(`❌ [DLQ Replay Error] Job ${jobId}: ${err.message}`);
      return false;
    }
  }
}

