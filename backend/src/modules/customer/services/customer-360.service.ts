import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { Customer360Dossier } from '../interfaces/customer.interface';

@Injectable()
export class Customer360Service {
  private readonly logger = new Logger(Customer360Service.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a 360-degree customer intelligence dossier for Customer Care, Support & Fraud Ops.
   * Collates LTV, AOV, delivery success rate, RTO loss tally, BTRC SMS receipts,
   * IVR/agent call verification history, dermal diagnostic history, and warranty/RMA requests.
   *
   * @param customerId Target user UUID
   */
  async getCustomer360(customerId: string): Promise<Customer360Dossier> {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      include: {
        loyaltyAccount: true,
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // 1. Fetch orders with relations (calls, rto, items, rma, mushak)
    const orders = await this.prisma.order.findMany({
      where: { userId: customerId },
      include: {
        callVerifications: {
          orderBy: { calledAt: 'desc' },
        },
        rtoExpenses: true,
        mushakInvoice: {
          select: {
            mushakSerialNo: true,
          },
        },
        items: {
          select: {
            id: true,
            title: true,
            quantity: true,
            unitPriceBdt: true,
            lineTotalBdt: true,
          },
        },
        rmaRequests: {
          select: {
            id: true,
            rmaNumber: true,
            status: true,
            primaryReason: true,
            requestedAmountBdt: true,
            approvedRefundAmountBdt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch RMA requests
    const rmaRequests = await this.prisma.rmaRequest.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Fetch notification logs (BTRC SMS & WhatsApp receipts)
    const notificationLogs = await this.prisma.notificationLog.findMany({
      where: { recipientPhone: user.phone },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 6. Collate call verifications across orders
    const callVerifications = orders
      .flatMap((o) =>
        (o.callVerifications || []).map((cv) => ({
          ...cv,
          orderNumber: o.orderNumber,
        })),
      )
      .sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime());

    // 7. Calculate Financial & Delivery Performance Metrics
    const totalOrdersCount = orders.length;
    const deliveredOrdersCount = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    ).length;
    const cancelledOrdersCount = orders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    ).length;
    const returnedOrdersCount = orders.filter(
      (o) => o.status === OrderStatus.RETURNED,
    ).length;

    const completedOrActiveOrders = orders.filter(
      (o) => o.status !== OrderStatus.CANCELLED,
    );
    const lifetimeValueBdt = completedOrActiveOrders.reduce(
      (sum, o) => sum + Number(o.totalPayableBdt),
      0,
    );
    const averageOrderValueBdt =
      completedOrActiveOrders.length > 0
        ? Math.round((lifetimeValueBdt / completedOrActiveOrders.length) * 100) / 100
        : 0;

    const deliverySuccessRatePercent =
      totalOrdersCount > 0
        ? Math.round((deliveredOrdersCount / totalOrdersCount) * 10000) / 100
        : 100.0;

    const rtoLossTotalBdt = orders.reduce((total, order) => {
      const orderRto = (order.rtoExpenses || []).reduce(
        (sum, exp) => sum + Number(exp.totalLossBdt),
        0,
      );
      return total + orderRto;
    }, 0);

    // 8. Client Privilege Status
    const loyaltyStatus = {
      isRepeatClient: deliveredOrdersCount > 0,
      privilegeDiscountPercent: deliveredOrdersCount > 0 ? 5 : 0,
    };


    // 10. Assemble complete dossier
    return {
      overview: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        isBlacklisted: user.isBlacklisted,
        fraudRiskScore: user.fraudRiskScore,
        customerSince: user.createdAt.toISOString(),
      },
      financialMetrics: {
        lifetimeValueBdt,
        averageOrderValueBdt,
        totalOrdersCount,
        deliveredOrdersCount,
        cancelledOrdersCount,
        returnedOrdersCount,
        deliverySuccessRatePercent,
        rtoLossTotalBdt,
      },
      loyaltyStatus,
      interactionTimeline: {
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalPayableBdt: Number(o.totalPayableBdt),
          mushakSixThreeNumber: o.mushakInvoice?.mushakSerialNo ?? null,
          itemCount: o.items.length,
          itemsSummary: o.items
            .map((i) => `${i.quantity}x ${i.title}`)
            .join(', '),
          createdAt: o.createdAt.toISOString(),
        })),
        smsLogs: notificationLogs.map((n) => ({
          id: n.id,
          channel: n.channel,
          templateName: n.templateName,
          status: n.status,
          messageBody: n.messageBody,
          sentAt: n.sentAt ? n.sentAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        })),
        callVerifications: callVerifications.map((cv) => ({
          id: cv.id,
          orderNumber: cv.orderNumber,
          outcome: cv.callOutcome,
          notes: cv.notes,
          calledAt: cv.calledAt.toISOString(),
          nextFollowUpAt: cv.nextFollowUpAt
            ? cv.nextFollowUpAt.toISOString()
            : null,
        })),
        rmaRequests: rmaRequests.map((r) => ({
          id: r.id,
          rmaNumber: r.rmaNumber,
          status: r.status,
          reason: r.primaryReason,
          refundAmountBdt: Number(
            r.approvedRefundAmountBdt ?? r.requestedAmountBdt,
          ),
          createdAt: r.createdAt.toISOString(),
        })),
      },
    };
  }
}
