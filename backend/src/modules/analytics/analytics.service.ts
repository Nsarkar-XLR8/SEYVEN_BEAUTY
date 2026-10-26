import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { DeduplicationService } from './services/deduplication.service';
import { MetaCapiWorker } from './workers/meta-capi.worker';
import { Ga4Client } from './services/ga4.client';
import { AttributionService } from './services/attribution.service';
import { PiiHasher } from './utils/pii-hasher.util';
import { IngestAnalyticsEventDto } from './dto/analytics-event.dto';
import { AttributionQueryDto } from './dto/attribution-query.dto';
import {
  AttributionReportResponse,
  IngestAnalyticsEventResult,
} from './interfaces/analytics.interface';
import {
  MetaCapiContentItem,
  MetaCapiEventPayload,
  MetaCapiUserData,
} from './interfaces/meta-capi.interface';
import { Ga4Event, Ga4Item } from './interfaces/ga4.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deduplicationService: DeduplicationService,
    private readonly metaCapiWorker: MetaCapiWorker,
    private readonly ga4Client: Ga4Client,
    private readonly attributionService: AttributionService,
  ) {}

  /**
   * Ingest a server-side marketing event with deduplication, PII SHA-256 hashing,
   * Meta CAPI worker dispatch, and GA4 MP delivery.
   */
  async ingestEvent(
    dto: IngestAnalyticsEventDto,
    fallbackIp?: string,
    fallbackUserAgent?: string,
    userId?: string,
  ): Promise<IngestAnalyticsEventResult> {
    const eventTime = dto.eventTime || Math.floor(Date.now() / 1000);
    const resolvedEventId =
      dto.eventId ||
      this.deduplicationService.generateSharedEventId(
        dto.eventName,
        dto.customData?.orderId || dto.guestToken || uuidv4().slice(0, 8),
      );

    // 1. Deduplication Check
    const dedupResult = await this.deduplicationService.registerAndCheck(
      resolvedEventId,
      dto.eventName,
      'server',
    );

    const clientIp = dto.userData?.clientIp || fallbackIp || '127.0.0.1';
    const clientUserAgent = dto.userData?.userAgent || fallbackUserAgent || 'Seyven-Server/1.0';

    // 2. Normalize and SHA-256 hash PII for Meta CAPI
    const hashedPhone = PiiHasher.normalizeAndHashPhone(dto.userData?.phone);
    const hashedEmail = PiiHasher.normalizeAndHashEmail(dto.userData?.email);
    const hashedFirstName = PiiHasher.normalizeAndHashField(dto.userData?.firstName);
    const hashedLastName = PiiHasher.normalizeAndHashField(dto.userData?.lastName);
    const hashedCity = PiiHasher.normalizeAndHashField(dto.userData?.city);
    const hashedDivision = PiiHasher.normalizeAndHashField(dto.userData?.division);
    const hashedCountry = PiiHasher.hashSha256('bd');

    const metaUserData: MetaCapiUserData = {
      ...(hashedPhone ? { ph: [hashedPhone] } : {}),
      ...(hashedEmail ? { em: [hashedEmail] } : {}),
      ...(hashedFirstName ? { fn: [hashedFirstName] } : {}),
      ...(hashedLastName ? { ln: [hashedLastName] } : {}),
      ...(hashedCity ? { ct: [hashedCity] } : {}),
      ...(hashedDivision ? { st: [hashedDivision] } : {}),
      country: [hashedCountry],
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      ...(dto.userData?.fbp ? { fbp: dto.userData.fbp } : {}),
      ...(dto.userData?.fbc ? { fbc: dto.userData.fbc } : {}),
    };

    // 3. Build Meta CAPI Payload
    const metaContents: MetaCapiContentItem[] = (dto.customData?.contents || []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.itemPrice,
      title: item.title,
      category: item.category,
    }));

    const metaPayload: MetaCapiEventPayload = {
      event_name: dto.eventName,
      event_time: eventTime,
      event_id: resolvedEventId,
      event_source_url: dto.eventSourceUrl || 'https://seyven.com',
      action_source: dto.actionSource || 'website',
      user_data: metaUserData,
      custom_data: {
        value: dto.customData?.value,
        currency: dto.customData?.currency || 'BDT',
        order_id: dto.customData?.orderId,
        content_type: dto.customData?.contentType || 'product',
        contents: metaContents.length > 0 ? metaContents : undefined,
        content_ids: dto.customData?.contentIds || (metaContents.length > 0 ? metaContents.map((c) => c.id) : undefined),
        num_items: dto.customData?.numItems || metaContents.reduce((s, i) => s + i.quantity, 0) || undefined,
      },
    };

    let metaDispatched = false;
    let ga4Dispatched = false;

    // 4. Dispatch to Meta CAPI Background Worker if not duplicate
    if (!dedupResult.isDuplicate) {
      try {
        await this.metaCapiWorker.dispatchWithRetry(metaPayload);
        metaDispatched = true;
      } catch (metaErr: unknown) {
        this.logger.warn(`[Analytics Service] Meta CAPI worker returned warning: ${(metaErr as Error).message}`);
      }
    }

    // 5. Dispatch to GA4 Measurement Protocol
    try {
      const ga4Items: Ga4Item[] = (dto.customData?.contents || []).map((item) => ({
        item_id: item.id,
        item_name: item.title || item.id,
        price: item.itemPrice,
        quantity: item.quantity,
        item_category: item.category,
      }));

      const ga4EventName = this.ga4Client.mapToGa4EventName(dto.eventName);
      const ga4Event: Ga4Event = {
        name: ga4EventName,
        params: {
          currency: dto.customData?.currency || 'BDT',
          value: dto.customData?.value,
          transaction_id: dto.customData?.orderId,
          coupon: dto.customData?.coupon,
          items: ga4Items.length > 0 ? ga4Items : undefined,
        },
      };

      const clientId = dto.clientId || dto.guestToken || uuidv4();
      const ga4Res = await this.ga4Client.dispatchEvent(clientId, ga4Event, userId);
      ga4Dispatched = ga4Res.success;
    } catch (ga4Err: unknown) {
      this.logger.warn(`[Analytics Service] GA4 MP dispatch returned warning: ${(ga4Err as Error).message}`);
    }

    // 6. Record marketing event in database
    try {
      await (this.prisma as any).marketingEvent.create({
        data: {
          id: uuidv4(),
          eventId: resolvedEventId,
          eventName: dto.eventName,
          eventSource: 'server',
          userId: userId || null,
          guestToken: dto.guestToken || null,
          userPhoneHash: hashedPhone || null,
          userEmailHash: hashedEmail || null,
          ipAddress: clientIp,
          userAgent: clientUserAgent,
          fbp: dto.userData?.fbp || null,
          fbc: dto.userData?.fbc || null,
          utmSource: dto.lastTouchUtm?.utmSource || dto.firstTouchUtm?.utmSource || null,
          utmMedium: dto.lastTouchUtm?.utmMedium || dto.firstTouchUtm?.utmMedium || null,
          utmCampaign: dto.lastTouchUtm?.utmCampaign || dto.firstTouchUtm?.utmCampaign || null,
          utmTerm: dto.lastTouchUtm?.utmTerm || dto.firstTouchUtm?.utmTerm || null,
          utmContent: dto.lastTouchUtm?.utmContent || dto.firstTouchUtm?.utmContent || null,
          eventValueBdt: dto.customData?.value ? Number(dto.customData.value) : null,
          currency: dto.customData?.currency || 'BDT',
          customData: dto.customData ? JSON.stringify(dto.customData) : null,
          metaStatus: metaDispatched ? 'SENT' : dedupResult.isDuplicate ? 'DEDUPLICATED' : 'FAILED',
          ga4Status: ga4Dispatched ? 'SENT' : 'FAILED',
        },
      });
    } catch (dbErr: unknown) {
      this.logger.warn(`[Analytics Service] Could not log event to DB: ${(dbErr as Error).message}`);
    }

    return {
      success: true,
      eventId: resolvedEventId,
      eventName: dto.eventName,
      isDuplicate: dedupResult.isDuplicate,
      metaDispatched,
      ga4Dispatched,
      message: dedupResult.isDuplicate
        ? 'Event already registered; deduplicated across browser/server channels'
        : 'Event processed and dispatched to Meta CAPI & GA4 MP',
    };
  }

  /**
   * Helper to trigger server-side Purchase event directly when order is created/placed.
   */
  async trackOrderPurchase(
    order: {
      id: string;
      orderNumber: string;
      userId?: string | null;
      guestPhone: string;
      totalPayableBdt: number | any;
      shippingAddress?: any;
      items?: any[];
      metaEventId?: string | null;
      utmSource?: string | null;
      utmMedium?: string | null;
      utmCampaign?: string | null;
      utmTerm?: string | null;
      utmContent?: string | null;
      firstTouchUtm?: any;
      lastTouchUtm?: any;
      fbclid?: string | null;
      gclid?: string | null;
    },
    clientIp?: string,
    userAgent?: string,
  ): Promise<IngestAnalyticsEventResult> {
    const eventId = order.metaEventId || `purchase_${order.orderNumber}`;

    const contents: MetaCapiContentItem[] = (order.items || []).map((item) => ({
      id: item.sku || item.variantId || item.productId,
      quantity: Number(item.quantity || 1),
      item_price: Number(item.unitPriceBdt || 0),
      title: item.title,
    }));

    const dto: IngestAnalyticsEventDto = {
      eventName: 'Purchase',
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: `https://seyven.com/checkout/success?order=${order.orderNumber}`,
      userData: {
        phone: order.guestPhone,
        firstName: order.shippingAddress?.fullName?.split(' ')[0],
        lastName: order.shippingAddress?.fullName?.split(' ').slice(1).join(' '),
        city: order.shippingAddress?.district,
        division: order.shippingAddress?.division,
        clientIp,
        userAgent,
      },
      customData: {
        value: Number(order.totalPayableBdt || 0),
        currency: 'BDT',
        orderId: order.orderNumber,
        contentType: 'product',
        contents,
        contentIds: contents.map((c) => c.id),
        numItems: contents.reduce((s, i) => s + i.quantity, 0),
      },
      firstTouchUtm: order.firstTouchUtm,
      lastTouchUtm: order.lastTouchUtm,
    };

    return this.ingestEvent(dto, clientIp, userAgent, order.userId || undefined);
  }

  /**
   * Generates admin marketing attribution and campaign ROAS report.
   */
  async getAttributionReport(dto: AttributionQueryDto): Promise<AttributionReportResponse> {
    return this.attributionService.getAttributionReport(dto);
  }
}
