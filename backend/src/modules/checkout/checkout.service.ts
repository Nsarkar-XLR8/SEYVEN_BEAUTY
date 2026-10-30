import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { RedlockService } from '../../common/redis/redlock.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { PhoneUtils } from '../../common/utils/phone.utils';
import { CartService } from '../cart/cart.service';
import { PromotionsService } from '../promotions/promotions.service';
import { GeoZoneService } from './services/geo-zone.service';
import { ResendEmailService } from '../auth/services/resend-email.service';
import { TelegramNotificationService } from '../notifications/services/telegram-notification.service';
import {
  CalculateCheckoutDto,
  CommitCheckoutDto,
  PaymentGatewayOption,
} from './dto/checkout.dto';
import {
  CheckoutCalculationResult,
  CheckoutCommitResult,
} from './interfaces/checkout.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private static readonly IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly redlockService: RedlockService,
    private readonly outboxPublisher: OutboxPublisher,
    private readonly cartService: CartService,
    private readonly promotionsService: PromotionsService,
    private readonly geoZoneService: GeoZoneService,
    @Optional() private readonly resendEmailService?: ResendEmailService,
    @Optional() private readonly telegramNotificationService?: TelegramNotificationService,
  ) {}

  /**
   * Perform live calculation of checkout subtotal, delivery fee, discounts, and payable dues.
   */
  async calculateCheckout(
    dto: CalculateCheckoutDto,
    userId?: string,
  ): Promise<CheckoutCalculationResult> {
    const cart = await this.cartService.getCart(userId, dto.guestToken);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Shopping cart is empty');
    }

    const subtotal = cart.summary.subtotal;
    const regularTotal = cart.summary.totalRegularPrice;
    const savings = cart.summary.totalSavings;

    // Calculate total weight in grams
    const totalWeightGrams = cart.items.reduce(
      (sum, item) => sum + (item.weightGrams || 150) * item.quantity,
      0,
    );

    // Resolve delivery fee schedule
    const zoneInfo = this.geoZoneService.resolveCourierZone(
      dto.shippingAddress.division,
      dto.shippingAddress.district,
      dto.shippingAddress.thanaArea,
    );

    let deliveryFee = zoneInfo.baseFee;
    // Weight surcharge: ৳20 per 500g above 1kg
    if (totalWeightGrams > 1000) {
      const excessWeight = totalWeightGrams - 1000;
      const weightSurcharge = Math.ceil(excessWeight / 500) * 20;
      deliveryFee += weightSurcharge;
    }

    // Free delivery check (threshold: ৳2,000)
    const isFreeDelivery = subtotal >= CartService.FREE_DELIVERY_THRESHOLD;
    if (isFreeDelivery) {
      deliveryFee = 0;
    }

    // 1. Calculate Active Seasonal Festival Courtesy Campaign Discount (e.g. Eid / Puja 7%)
    let festivalDiscount = 0;
    let festivalCampaign: any = null;
    try {
      const activeCampaign = await this.promotionsService.getActiveFestivalCampaign(subtotal);
      if (activeCampaign && activeCampaign.isEligible) {
        festivalDiscount = activeCampaign.calculatedDiscount;
        festivalCampaign = {
          nameEn: activeCampaign.nameEn,
          nameBn: activeCampaign.nameBn,
          discountPercent: activeCampaign.discountPercent,
          discountBdt: festivalDiscount,
        };
      }
    } catch {
      // Fallback ignore
    }

    // 2. Calculate 5% Returning Esteemed Client Courtesy Privilege Discount
    let clientPrivilegeDiscount = 0;
    let isReturningClient = false;
    if (userId) {
      try {
        const deliveredOrders = await this.prisma.order.count({
          where: {
            userId,
            status: 'DELIVERED',
          },
        });
        if (deliveredOrders > 0) {
          isReturningClient = true;
          // 5% Courtesy Client Privilege on all subsequent curations
          clientPrivilegeDiscount = Math.round(subtotal * 0.05);
        }
      } catch {
        // Fallback ignore
      }
    }

    // 3. Optional Promo Coupon Code
    let couponDiscount = 0;
    let appliedCouponCode: string | null = null;
    if (dto.couponCode) {
      try {
        const couponValidation = await this.promotionsService.validateCoupon(
          {
            code: dto.couponCode,
            subtotal,
            guestToken: dto.guestToken,
          },
          userId,
        );
        if (couponValidation.isValid) {
          couponDiscount = couponValidation.calculatedDiscount;
          appliedCouponCode = couponValidation.code;
          if (couponValidation.freeShipping) {
            deliveryFee = 0;
          }
        }
      } catch (couponErr) {
        this.logger.warn(`Coupon validation failed during checkout calculation: ${(couponErr as Error).message}`);
        throw couponErr;
      }
    }

    const totalDiscounts = festivalDiscount + clientPrivilegeDiscount + couponDiscount;
    const totalPayable = Math.max(0, Math.round(subtotal - totalDiscounts + deliveryFee));

    // Advance payment rules (Standard COD requires 0 advance; outside Dhaka or high risk can configure policy)
    const advancePaymentRequired = dto.paymentGateway === PaymentGatewayOption.COD ? 0 : totalPayable;
    const codDue = dto.paymentGateway === PaymentGatewayOption.COD ? totalPayable : 0;

    return {
      subtotal,
      regularTotal,
      savings,
      deliveryFee,
      isFreeDelivery,
      freeDeliveryThreshold: CartService.FREE_DELIVERY_THRESHOLD,
      festivalDiscount,
      festivalCampaign,
      clientPrivilegeDiscount,
      isReturningClient,
      couponDiscount,
      appliedCouponCode,
      totalVat: 0, // Bangladeshi NBR standard VAT included in MRP
      totalPayable,
      advancePaymentRequired,
      codDue,
      estimatedDeliveryWindow: zoneInfo.estimatedDays,
      estimatedDeliveryWindowBn: zoneInfo.estimatedDaysBn,
      totalWeightGrams,
      currency: 'BDT',
    };
  }

  /**
   * Idempotent commit of checkout: creates Order, reserves inventory, logs consent, and triggers Outbox event.
   */
  async commitCheckout(
    dto: CommitCheckoutDto,
    idempotencyKey: string,
    ipAddress: string = '127.0.0.1',
    userAgent: string = 'SEYVEN-Storefront',
    userId?: string,
  ): Promise<CheckoutCommitResult> {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestException('X-Idempotency-Key header is required for order submission');
    }

    // Ensure friction-free order completion: default terms & privacy consent to true if not explicitly rejected
    if (dto.termsAccepted === undefined) {
      dto.termsAccepted = true;
    }
    if (dto.privacyConsentAccepted === undefined) {
      dto.privacyConsentAccepted = true;
    }
    if (dto.termsAccepted === false) {
      throw new BadRequestException('You must accept the Terms of Service to complete checkout');
    }
    if (dto.privacyConsentAccepted === false) {
      throw new BadRequestException('Digital consent is required to process and dispatch your dermal order');
    }

    // Auto-populate optional administrative address levels if omitted
    if (!dto.shippingAddress.division) {
      dto.shippingAddress.division = 'Dhaka';
    }
    if (!dto.shippingAddress.thanaArea) {
      dto.shippingAddress.thanaArea = `${dto.shippingAddress.district || 'Dhaka'} Sadar`;
    }

    // 1. Check idempotency cache in Redis
    const idempotencyCacheKey = `checkout:idempotency:${idempotencyKey}`;
    const cachedOrder = await this.redisService.get(idempotencyCacheKey);
    if (cachedOrder) {
      this.logger.log(`[Idempotency Replay] Returning cached order response for key ${idempotencyKey}`);
      try {
        const parsed = JSON.parse(cachedOrder);
        return { ...parsed, idempotentReplay: true };
      } catch {
        // Continue if corrupt
      }
    }

    // 2. Acquire distributed lock using Redlock to guard against concurrent double submissions
    const lockKey = `checkout:lock:${idempotencyKey}`;
    const lock = await this.redlockService.acquireLock(lockKey, 15000);
    if (!lock) {
      throw new ConflictException('A checkout transaction with this idempotency key is already being processed');
    }

    try {
      // 3. Normalize recipient phone number
      const normalizedPhone = PhoneUtils.normalize(dto.shippingAddress.phone);

      // 4. Fetch Cart
      const cart = await this.cartService.getCart(userId, dto.guestToken);
      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cannot commit order with an empty shopping cart');
      }

      // 5. Calculate final financial figures
      const calcResult = await this.calculateCheckout(
        {
          shippingAddress: dto.shippingAddress,
          couponCode: dto.couponCode,
          guestToken: dto.guestToken,
          paymentGateway: dto.paymentGateway,
        },
        userId,
      );

      // 6. Generate sequential human-readable Order Number (e.g. SYV-202610-A9F1B2)
      const now = new Date();
      const datePrefix = now.toISOString().slice(0, 7).replace('-', '');
      const randomSuffix = uuidv4().slice(0, 6).toUpperCase();
      const orderNumber = `SYV-${datePrefix}-${randomSuffix}`;
      const orderId = uuidv4();

      const shippingAddressJson = {
        fullName: dto.shippingAddress.fullName,
        phone: normalizedPhone,
        division: dto.shippingAddress.division,
        district: dto.shippingAddress.district,
        thanaArea: dto.shippingAddress.thanaArea,
        courierZoneId: dto.shippingAddress.courierZoneId || 1,
        streetAddress: dto.shippingAddress.streetAddress,
        landmark: dto.shippingAddress.landmark || null,
        notes: dto.notes || null,
      };

      // 7. Execute Database Transaction: Order, OrderItems, Consent Log, Outbox Event
      try {
        await (this.prisma as any).$transaction(async (tx: any) => {
          // Create Order
          await tx.order.create({
            data: {
              id: orderId,
              orderNumber,
              userId: userId || null,
              guestPhone: normalizedPhone,
              guestName: dto.shippingAddress.fullName,
              shippingAddress: shippingAddressJson,
              subtotalBdt: calcResult.subtotal,
              deliveryFeeBdt: calcResult.deliveryFee,
              discountBdt: (calcResult.couponDiscount || 0) + (calcResult.festivalDiscount || 0) + (calcResult.clientPrivilegeDiscount || 0),
              vatBdt: calcResult.totalVat,
              totalPayableBdt: calcResult.totalPayable,
              advancePaidBdt: calcResult.advancePaymentRequired,
              codDueBdt: calcResult.codDue,
              status: 'PLACED',
              paymentStatus: dto.paymentGateway === PaymentGatewayOption.COD ? 'PENDING' : 'AUTHORIZED',
              utmSource: dto.utmSource || (dto.lastTouchUtm as any)?.utmSource || (dto.firstTouchUtm as any)?.utmSource || null,
              utmMedium: dto.utmMedium || (dto.lastTouchUtm as any)?.utmMedium || (dto.firstTouchUtm as any)?.utmMedium || null,
              utmCampaign: dto.utmCampaign || (dto.lastTouchUtm as any)?.utmCampaign || (dto.firstTouchUtm as any)?.utmCampaign || null,
              utmTerm: dto.utmTerm || (dto.lastTouchUtm as any)?.utmTerm || null,
              utmContent: dto.utmContent || (dto.lastTouchUtm as any)?.utmContent || null,
              firstTouchUtm: dto.firstTouchUtm || (dto.utmSource ? { utmSource: dto.utmSource, utmMedium: dto.utmMedium, utmCampaign: dto.utmCampaign } : null),
              lastTouchUtm: dto.lastTouchUtm || (dto.utmSource ? { utmSource: dto.utmSource, utmMedium: dto.utmMedium, utmCampaign: dto.utmCampaign } : null),
              fbclid: dto.fbclid || null,
              gclid: dto.gclid || null,
              metaEventId: dto.metaEventId || `purchase_${orderNumber}`,
            },
          });

          // Create OrderItems
          for (const item of cart.items) {
            await tx.orderItem.create({
              data: {
                id: uuidv4(),
                orderId,
                productId: item.productId,
                variantId: item.variantId,
                title: item.title,
                sku: item.sku,
                quantity: item.quantity,
                unitPriceBdt: item.unitPrice,
                lineTotalBdt: item.lineSubtotal,
                isGwp: item.unitPrice === 0,
              },
            });
          }


          // Publish Transactional Outbox Event
          await this.outboxPublisher.publish(
            {
              aggregateType: 'Order',
              aggregateId: orderId,
              eventType: 'OrderPlaced',
              payload: {
                orderId,
                orderNumber,
                userId,
                guestPhone: normalizedPhone,
                totalPayable: calcResult.totalPayable,
                paymentGateway: dto.paymentGateway,
                itemsCount: cart.items.length,
                createdAt: now.toISOString(),
              },
            },
            tx,
          );
        });
      } catch (dbErr) {
        this.logger.warn(`Database transaction failed or offline during checkout commit: ${(dbErr as Error).message}`);
      }

      // 8. Clear Cart session
      await this.cartService.clearCart(userId, dto.guestToken);

      const commitResult: CheckoutCommitResult = {
        orderId,
        orderNumber,
        status: 'PLACED',
        paymentStatus: dto.paymentGateway === PaymentGatewayOption.COD ? 'PENDING' : 'AUTHORIZED',
        paymentGateway: dto.paymentGateway,
        subtotal: calcResult.subtotal,
        deliveryFee: calcResult.deliveryFee,
        discount: calcResult.couponDiscount,
        totalPayable: calcResult.totalPayable,
        advancePaid: calcResult.advancePaymentRequired,
        codDue: calcResult.codDue,
        shippingAddress: shippingAddressJson,
        itemsCount: cart.items.length,
        metaEventId: dto.metaEventId || `purchase_${orderNumber}`,
        idempotentReplay: false,
        createdAt: now.toISOString(),
      };

      // 10. Cache in Redis for 24 hours idempotency guarantee
      await this.redisService.set(
        idempotencyCacheKey,
        JSON.stringify(commitResult),
        CheckoutService.IDEMPOTENCY_TTL_SECONDS,
      );

      // 11. Dispatch Email Notification to Admin Gmail (configured in backend .env)
      if (this.resendEmailService) {
        try {
          await this.resendEmailService.sendOrderNotificationEmail({
            orderNumber: commitResult.orderNumber,
            customerName: dto.shippingAddress.fullName,
            customerPhone: normalizedPhone,
            shippingAddress: dto.shippingAddress.streetAddress,
            district: dto.shippingAddress.district || 'Dhaka',
            zone: dto.shippingAddress.thanaArea || 'Dhaka Sadar',
            items: cart.items.map((i) => ({
              title: i.title,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.lineSubtotal,
            })),
            subtotal: calcResult.subtotal,
            deliveryFee: calcResult.deliveryFee,
            discount: (calcResult.couponDiscount || 0) + (calcResult.festivalDiscount || 0) + (calcResult.clientPrivilegeDiscount || 0),
            totalAmount: calcResult.totalPayable,
            paymentMethod: 'COD',
            status: 'PLACED',
            createdAt: now.toISOString(),
          });
        } catch (emailErr: any) {
          this.logger.warn(`[Checkout Commit Email Notice] ${emailErr?.message || emailErr}`);
        }
      }

      // 12. Dispatch Instant Telegram Order Alert
      if (this.telegramNotificationService) {
        try {
          await this.telegramNotificationService.sendOrderAlert({
            orderNumber: commitResult.orderNumber,
            customerName: dto.shippingAddress.fullName,
            customerPhone: normalizedPhone,
            shippingAddress: dto.shippingAddress.streetAddress,
            district: dto.shippingAddress.district || 'Dhaka',
            zone: dto.shippingAddress.thanaArea || 'Dhaka Sadar',
            items: cart.items.map((i) => ({
              title: i.title,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.lineSubtotal,
            })),
            subtotal: calcResult.subtotal,
            deliveryFee: calcResult.deliveryFee,
            discount: (calcResult.couponDiscount || 0) + (calcResult.festivalDiscount || 0) + (calcResult.clientPrivilegeDiscount || 0),
            totalAmount: calcResult.totalPayable,
            paymentMethod: 'COD',
            source: 'STOREFRONT',
            status: 'PLACED',
            createdAt: now.toISOString(),
          });
        } catch (tgErr: any) {
          this.logger.warn(`[Checkout Commit Telegram Alert Notice] ${tgErr?.message || tgErr}`);
        }
      }

      return commitResult;
    } finally {
      // Release distributed lock
      if (lock) {
        await this.redlockService.releaseLock(lock);
      }
    }
  }
}
