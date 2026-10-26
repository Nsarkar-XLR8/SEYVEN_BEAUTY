import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { OutboxPublisher } from '../../../common/database/outbox/outbox.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentRecoveryService {
  private readonly logger = new Logger(PaymentRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
  ) {}

  /**
   * Handle unfulfillable captured payment due to stock exhaustion.
   * Invoked when payment is captured after reservation expired and physical lots are depleted.
   */
  async handleUnfulfillablePayment(
    orderId: string,
    transactionId: string,
    amountBdt: number,
    exhaustedVariantSkus: string[] = [],
  ): Promise<{
    orderId: string;
    status: OrderStatus;
    actionTaken: string;
  }> {
    this.logger.error(
      `[CRITICAL RISK] Payment captured for unfulfillable order ${orderId}. Trx: ${transactionId}, Amount: ${amountBdt}, Exhausted SKUs: ${exhaustedVariantSkus.join(
        ', ',
      )}`,
    );

    // 1. Transition Order to UNFULFILLABLE_PAYMENT_CAPTURED
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
      },
    });

    // 2. Publish Outbox Event for Operations Desk and automated SMS Alert
    await this.outboxPublisher.publish({
      aggregateType: 'Order',
      aggregateId: orderId,
      eventType: 'UnfulfillablePaymentCaptured',
      payload: {
        orderId,
        orderNumber: updatedOrder.orderNumber,
        transactionId,
        amountBdt,
        exhaustedSkus: exhaustedVariantSkus,
        customerPhone: updatedOrder.guestPhone,
        capturedAt: new Date().toISOString(),
        remedy: 'AUTOMATIC_REFUND_OR_PRIORITY_REPLENISHMENT',
      },
    });

    return {
      orderId,
      status: OrderStatus.UNFULFILLABLE_PAYMENT_CAPTURED,
      actionTaken: 'FLAGGED_UNFULFILLABLE_AND_EMITTED_OUTBOX_EVENT',
    };
  }

  /**
   * Verify if order has active stock reservations or available inventory before finalizing fulfillment.
   */
  async verifyStockAvailability(orderId: string): Promise<{
    isStockAvailable: boolean;
    exhaustedSkus: string[];
  }> {
    const orderItems = await (this.prisma as any).orderItem.findMany({
      where: { orderId },
    });

    const exhaustedSkus: string[] = [];

    for (const item of orderItems) {
      // Check total available stock across active lots for variant
      const lots = await this.prisma.inventoryLot.findMany({
        where: {
          variantId: item.variantId,
          status: 'ACTIVE',
        },
      });

      const totalAvailable = lots.reduce((acc, lot) => acc + lot.availableQuantity, 0);
      if (totalAvailable < item.quantity) {
        exhaustedSkus.push(item.sku);
      }
    }

    return {
      isStockAvailable: exhaustedSkus.length === 0,
      exhaustedSkus,
    };
  }
}
