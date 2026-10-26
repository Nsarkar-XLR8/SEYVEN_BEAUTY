import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { NewsletterQueueService } from './newsletter-queue.service';
import { SubscribeNewsletterDto } from '../dto/subscribe-newsletter.dto';
import { BroadcastCampaignDto } from '../dto/broadcast-campaign.dto';
import {
  NewsletterCampaignEntity,
  NewsletterDispatchJob,
  NewsletterSubscriberEntity,
} from '../interfaces/newsletter.interface';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  // In-memory fallback repository for subscribers and campaigns
  private readonly memorySubscribers = new Map<string, NewsletterSubscriberEntity>();
  private readonly memoryCampaigns = new Map<string, NewsletterCampaignEntity>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: NewsletterQueueService,
  ) {
    this.seedInitialSubscribers();
  }

  /**
   * Pre-seeds initial VIP / advisory subscribers for immediate testing & demo
   */
  private seedInitialSubscribers() {
    const demoSubscribers: Array<{ email: string; fullName: string; source: string }> = [
      { email: 'vip.amina@seyven.com.bd', fullName: 'Amina Chowdhury', source: 'SANCTUARY_VIP' },
      { email: 'taznin.rahman@gmail.com', fullName: 'Dr. Taznin Rahman', source: 'FOOTER' },
      { email: 'nusrat.jahan@dermal-bd.com', fullName: 'Nusrat Jahan', source: 'POPUP' },
      { email: 'farhana.yasmin@outlook.com', fullName: 'Farhana Yasmin', source: 'CHECKOUT' },
      { email: 'concierge.demo@seyven.com.bd', fullName: 'SEYVEN Client Care', source: 'CONCIERGE' },
    ];

    for (const sub of demoSubscribers) {
      const id = uuidv4();
      this.memorySubscribers.set(sub.email.toLowerCase(), {
        id,
        email: sub.email.toLowerCase(),
        fullName: sub.fullName,
        status: 'SUBSCRIBED',
        unsubscribeToken: crypto.randomBytes(24).toString('hex'),
        source: sub.source,
        createdAt: new Date(),
        unsubscribedAt: null,
      });
    }

    this.logger.log(`🌱 [NewsletterService] Initialized with ${this.memorySubscribers.size} subscribers.`);
  }

  /**
   * Subscribes a client to SEYVEN private client updates.
   * Handles idempotency: if already subscribed, returns success gracefully.
   */
  async subscribe(dto: SubscribeNewsletterDto): Promise<{ success: boolean; message: string; subscriberId: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if already in memory
    const existing = this.memorySubscribers.get(normalizedEmail);
    if (existing) {
      if (existing.status === 'SUBSCRIBED') {
        return {
          success: true,
          message: 'You are already subscribed to the SEYVEN Private Client Sanctuary.',
          subscriberId: existing.id,
        };
      } else {
        // Re-activate previously unsubscribed client
        existing.status = 'SUBSCRIBED';
        existing.unsubscribedAt = null;
        if (dto.fullName) existing.fullName = dto.fullName;
        this.logger.log(`🌟 [Newsletter] Client ${normalizedEmail} re-subscribed to newsletter.`);
        return {
          success: true,
          message: 'Welcome back! Your subscription to SEYVEN has been reactivated.',
          subscriberId: existing.id,
        };
      }
    }

    const newSubscriber: NewsletterSubscriberEntity = {
      id: uuidv4(),
      email: normalizedEmail,
      fullName: dto.fullName || null,
      status: 'SUBSCRIBED',
      unsubscribeToken: crypto.randomBytes(24).toString('hex'),
      source: dto.source || 'FOOTER',
      createdAt: new Date(),
      unsubscribedAt: null,
    };

    // Store in-memory
    this.memorySubscribers.set(normalizedEmail, newSubscriber);

    // Also persist to Prisma if model is available
    try {
      const prismaClient = this.prisma as any;
      if (prismaClient.newsletterSubscriber) {
        await prismaClient.newsletterSubscriber.upsert({
          where: { email: normalizedEmail },
          update: { status: 'SUBSCRIBED', unsubscribedAt: null },
          create: {
            id: newSubscriber.id,
            email: normalizedEmail,
            fullName: newSubscriber.fullName,
            status: 'SUBSCRIBED',
            unsubscribeToken: newSubscriber.unsubscribeToken,
            source: newSubscriber.source,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not persist to Prisma table (operating with in-memory store): ${err.message}`);
    }

    this.logger.log(`✨ [Newsletter] New subscriber recorded: ${normalizedEmail} (Source: ${newSubscriber.source})`);

    return {
      success: true,
      message: 'Thank you for subscribing to SEYVEN. Welcome to our beauty sanctuary.',
      subscriberId: newSubscriber.id,
    };
  }

  /**
   * One-click unsubscribe with compliance token.
   */
  async unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || token.trim() === '') {
      throw new BadRequestException('Invalid or missing unsubscribe token.');
    }

    let foundSubscriber: NewsletterSubscriberEntity | null = null;
    for (const sub of this.memorySubscribers.values()) {
      if (sub.unsubscribeToken === token) {
        foundSubscriber = sub;
        break;
      }
    }

    if (!foundSubscriber) {
      return {
        success: true,
        message: 'Your email address has been successfully unsubscribed from SEYVEN updates.',
      };
    }

    foundSubscriber.status = 'UNSUBSCRIBED';
    foundSubscriber.unsubscribedAt = new Date();

    try {
      const prismaClient = this.prisma as any;
      if (prismaClient.newsletterSubscriber) {
        await prismaClient.newsletterSubscriber.updateMany({
          where: { unsubscribeToken: token },
          data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
        });
      }
    } catch {
      // ignore
    }

    this.logger.log(`🔕 [Newsletter] Subscriber ${foundSubscriber.email} unsubscribed.`);

    return {
      success: true,
      message: `You have successfully unsubscribed (${foundSubscriber.email}) from SEYVEN dispatches.`,
    };
  }

  /**
   * Broadcasts a rich-text newsletter campaign to target recipients via the Queue with Dead Letter Queue.
   */
  async broadcastCampaign(dto: BroadcastCampaignDto, staffInfo?: { staffId?: string; role?: string }): Promise<{
    success: boolean;
    campaignId: string;
    recipientCount: number;
    message: string;
  }> {
    if (!dto.subject || !dto.contentHtml) {
      throw new BadRequestException('Subject and content HTML are required for broadcast.');
    }

    // Filter recipients based on audience
    const activeSubscribers = Array.from(this.memorySubscribers.values()).filter(
      (s) => s.status === 'SUBSCRIBED',
    );

    if (activeSubscribers.length === 0) {
      throw new BadRequestException('No active subscribers available to broadcast.');
    }

    const campaignId = uuidv4();
    const campaign: NewsletterCampaignEntity = {
      id: campaignId,
      title: dto.title,
      subject: dto.subject,
      previewText: dto.previewText || null,
      contentHtml: dto.contentHtml,
      discountCode: dto.discountCode || null,
      discountBanner: dto.discountBanner || null,
      targetAudience: dto.targetAudience || 'ALL_SUBSCRIBERS',
      status: 'SENDING',
      recipientCount: activeSubscribers.length,
      successCount: 0,
      failedCount: 0,
      sentAt: new Date(),
      createdAt: new Date(),
    };

    this.memoryCampaigns.set(campaignId, campaign);

    // Prepare jobs for Queue
    const jobs: NewsletterDispatchJob[] = activeSubscribers.map((subscriber) => ({
      id: uuidv4(),
      campaignId,
      recipientEmail: subscriber.email,
      recipientName: subscriber.fullName || undefined,
      subject: dto.subject,
      contentHtml: dto.contentHtml,
      previewText: dto.previewText,
      discountCode: dto.discountCode,
      discountBanner: dto.discountBanner,
      unsubscribeToken: subscriber.unsubscribeToken,
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    }));

    // Enqueue jobs to BullMQ / Primary Worker Queue
    await this.queueService.enqueueBatch(jobs);

    campaign.status = 'SENT';

    this.logger.log(
      `📢 [Broadcast Campaign] "${dto.title}" enqueued for ${jobs.length} recipients. DLQ protection active.`,
    );

    return {
      success: true,
      campaignId,
      recipientCount: jobs.length,
      message: `Campaign "${dto.title}" successfully queued for ${jobs.length} recipients.`,
    };
  }

  /**
   * Retrieves paginated list of subscribers and status summary.
   */
  getSubscribers() {
    const list = Array.from(this.memorySubscribers.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const activeCount = list.filter((s) => s.status === 'SUBSCRIBED').length;
    const unsubscribedCount = list.filter((s) => s.status === 'UNSUBSCRIBED').length;

    return {
      subscribers: list,
      total: list.length,
      activeCount,
      unsubscribedCount,
    };
  }

  /**
   * Retrieves past campaigns.
   */
  getCampaigns() {
    const dlqItems = this.queueService.getDeadLetterQueueItems();
    return Array.from(this.memoryCampaigns.values())
      .map((c) => ({
        ...c,
        dlqCount: dlqItems.filter((d) => d.campaignId === c.id).length,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * DLQ Inspection & Management endpoints
   */
  getDeadLetterQueueItems() {
    const items = this.queueService.getDeadLetterQueueItems();
    const metrics = this.queueService.getQueueMetrics();
    return {
      items,
      count: items.length,
      metrics,
    };
  }

  reDriveDlqItem(dlqId: string) {
    return this.queueService.reDriveDlqItem(dlqId);
  }

  reDriveAllDlq() {
    return this.queueService.reDriveAllDlq();
  }

  clearDlq() {
    return this.queueService.clearDeadLetterQueue();
  }
}
