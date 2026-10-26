import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NewsletterService } from './services/newsletter.service';
import { NewsletterQueueService } from './services/newsletter-queue.service';
import { NewsletterEmailService } from './services/newsletter-email.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('NewsletterService & DLQ Architecture', () => {
  let service: NewsletterService;
  let queueService: NewsletterQueueService;

  const mockPrisma = {
    newsletterSubscriber: {
      upsert: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'RESEND_API_KEY') return '';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterService,
        NewsletterQueueService,
        NewsletterEmailService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<NewsletterService>(NewsletterService);
    queueService = module.get<NewsletterQueueService>(NewsletterQueueService);
  });

  afterEach(() => {
    queueService.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(queueService).toBeDefined();
  });

  it('should successfully subscribe a new client email', async () => {
    const res = await service.subscribe({
      email: 'test.client@seyven.com.bd',
      fullName: 'Sanctuary Tester',
      source: 'FOOTER',
    });

    expect(res.success).toBe(true);
    expect(res.subscriberId).toBeDefined();

    const data = service.getSubscribers();
    const found = data.subscribers.find((s) => s.email === 'test.client@seyven.com.bd');
    expect(found).toBeDefined();
    expect(found?.status).toBe('SUBSCRIBED');
  });

  it('should handle idempotency when same client subscribes again', async () => {
    await service.subscribe({ email: 'duplicate@seyven.com.bd' });
    const res2 = await service.subscribe({ email: 'duplicate@seyven.com.bd' });

    expect(res2.success).toBe(true);
    expect(res2.message).toContain('already subscribed');
  });

  it('should unsubscribe client when valid token is provided', async () => {
    await service.subscribe({ email: 'unsub.client@seyven.com.bd' });
    const list = service.getSubscribers().subscribers;
    const client = list.find((s) => s.email === 'unsub.client@seyven.com.bd');

    expect(client).toBeDefined();
    const unsubRes = await service.unsubscribe(client!.unsubscribeToken);
    expect(unsubRes.success).toBe(true);

    const updated = service.getSubscribers().subscribers.find((s) => s.email === 'unsub.client@seyven.com.bd');
    expect(updated?.status).toBe('UNSUBSCRIBED');
  });

  it('should broadcast rich text campaign with discount and enqueue jobs', async () => {
    const broadcastResult = await service.broadcastCampaign({
      title: 'Eid Ul Fitr Exclusive 7% Discount',
      subject: 'Celebrate Eid with 7% Sanctuary Savings',
      contentHtml: '<p>Experience <strong>7% privilege savings</strong> on curated regimens.</p>',
      discountCode: 'EID7',
      discountBanner: '7% Eid Privilege Savings',
    });

    expect(broadcastResult.success).toBe(true);
    expect(broadcastResult.campaignId).toBeDefined();
    expect(broadcastResult.recipientCount).toBeGreaterThan(0);

    const campaigns = service.getCampaigns();
    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns[0].title).toBe('Eid Ul Fitr Exclusive 7% Discount');
  });

  it('should route failing jobs to the Dead Letter Queue (DLQ) after retry exhaustion and allow re-driving', async () => {
    const emailService = (queueService as any).emailService;
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('Simulated SMTP rejection'));

    const fakeJob = {
      id: 'job-dlq-1',
      campaignId: 'camp-1',
      recipientEmail: 'poisoned@invalid.org',
      subject: 'Test Subject',
      contentHtml: '<p>Test</p>',
      unsubscribeToken: 'token123',
      attemptCount: 2, // 1 away from max attempts (3)
      maxAttempts: 3,
      createdAt: new Date(),
    };

    // Execute job: will hit attempt 3 and route to DLQ
    await (queueService as any).executeJobWithRetryAndDlq(fakeJob);

    const dlqItems = queueService.getDeadLetterQueueItems();
    expect(dlqItems.length).toBe(1);
    expect(dlqItems[0].recipientEmail).toBe('poisoned@invalid.org');
    expect(dlqItems[0].errorMessage).toContain('Simulated SMTP rejection');

    // Test DLQ Re-drive
    const redriveRes = queueService.reDriveDlqItem(dlqItems[0].id);
    expect(redriveRes.success).toBe(true);
    expect(queueService.getDeadLetterQueueItems().length).toBe(0);
  });
});
