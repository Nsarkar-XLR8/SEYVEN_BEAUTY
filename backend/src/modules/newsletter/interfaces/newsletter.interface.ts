export type SubscriberStatus = 'SUBSCRIBED' | 'UNSUBSCRIBED';
export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
export type DispatchStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';
export type TargetAudience = 'ALL_SUBSCRIBERS' | 'VIP_CUSTOMERS' | 'ALL_CUSTOMERS';

export interface NewsletterSubscriberEntity {
  id: string;
  email: string;
  fullName?: string | null;
  status: SubscriberStatus;
  unsubscribeToken: string;
  source: string;
  createdAt: Date;
  unsubscribedAt?: Date | null;
}

export interface NewsletterCampaignEntity {
  id: string;
  title: string;
  subject: string;
  previewText?: string | null;
  contentHtml: string;
  discountCode?: string | null;
  discountBanner?: string | null;
  targetAudience: TargetAudience | string;
  status: CampaignStatus;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  dlqCount?: number;
  sentAt?: Date | null;
  createdAt: Date;
}

export interface NewsletterDispatchJob {
  id: string;
  campaignId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  contentHtml: string;
  previewText?: string;
  discountCode?: string;
  discountBanner?: string;
  unsubscribeToken: string;
  attemptCount: number;
  maxAttempts: number;
  createdAt: Date;
}

export interface DeadLetterQueueItem {
  id: string;
  jobId: string;
  campaignId: string;
  recipientEmail: string;
  subject: string;
  attemptCount: number;
  errorMessage: string;
  failedAt: Date;
  payload: NewsletterDispatchJob;
}
