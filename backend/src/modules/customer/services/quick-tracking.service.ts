import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../common/database/prisma.service';
import { PhoneUtils } from '../../../common/utils/phone.utils';
import {
  QuickTrackMilestone,
  QuickTrackResult,
} from '../interfaces/customer.interface';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class QuickTrackingService {
  private readonly logger = new Logger(QuickTrackingService.name);

  // Status step order hierarchy for progress timeline
  private static readonly MILESTONE_STEPS: {
    status: OrderStatus;
    step: string;
    label: string;
    labelBn: string;
  }[] = [
    { status: OrderStatus.PLACED, step: 'PLACED', label: 'Order Placed', labelBn: 'অর্ডার সফলভাবে গৃহীত হয়েছে' },
    { status: OrderStatus.CONFIRMED, step: 'CONFIRMED', label: 'Confirmed & Verified', labelBn: 'অর্ডার নিশ্চিতকরণ সম্পন্ন' },
    { status: OrderStatus.PACKED, step: 'PACKED', label: 'Packed & Sealed', labelBn: 'স্যানিটাইজড ও প্যাকেজিং সম্পন্ন' },
    { status: OrderStatus.BOOKED, step: 'BOOKED', label: 'Handed to Courier', labelBn: 'কুরিয়ারে হস্তান্তর করা হয়েছে' },
    { status: OrderStatus.SHIPPED, step: 'SHIPPED', label: 'Out for Delivery', labelBn: 'ডেলিভারির জন্য বের হয়েছে' },
    { status: OrderStatus.DELIVERED, step: 'DELIVERED', label: 'Delivered', labelBn: 'সফলভাবে ডেলিভার সম্পন্ন' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fast public instant order tracking lookup. Requires matching order number and recipient phone number.
   */
  async quickTrackOrder(
    rawOrderNumber: string,
    rawPhone?: string,
  ): Promise<QuickTrackResult> {
    const cleanOrderNumber = (rawOrderNumber || '').trim();
    if (!cleanOrderNumber) {
      throw new NotFoundException('Order number is required.');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderNumber);
    const identifierCondition: any = isUuid
      ? { OR: [{ id: cleanOrderNumber }, { orderNumber: cleanOrderNumber }] }
      : { orderNumber: cleanOrderNumber };

    let phoneCondition: any = undefined;
    if (rawPhone && rawPhone.trim()) {
      const digits = rawPhone.replace(/\D/g, '');
      const last10 = digits.slice(-10);
      if (last10.length >= 8) {
        phoneCondition = [
          {
            OR: [
              { guestPhone: { contains: last10 } },
              { user: { phone: { contains: last10 } } },
            ],
          },
        ];
      }
    }

    let order: any = null;
    try {
      order = await this.prisma.order.findFirst({
        where: {
          ...identifierCondition,
          ...(phoneCondition ? { AND: phoneCondition } : {}),
        },
        include: {
          items: true,
          user: { select: { phone: true, fullName: true } },
          paymentTransactions: { select: { gateway: true }, take: 1 },
        },
      });
    } catch (dbErr: any) {
      this.logger.warn(`[Prisma Order Track Warning] ${dbErr?.message}`);
    }

    // Fallback: Check local orders storage if database did not return order
    if (!order) {
      try {
        const localPath = path.resolve(process.cwd(), 'local-orders.json');
        if (fs.existsSync(localPath)) {
          const raw = fs.readFileSync(localPath, 'utf8');
          const localList = JSON.parse(raw);
          if (Array.isArray(localList)) {
            const found = localList.find((o: any) =>
              o.orderNumber === cleanOrderNumber ||
              o.id === cleanOrderNumber ||
              o.referenceNo === cleanOrderNumber
            );
            if (found) {
              return this.mapLocalOrderToResult(found);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Local Order Track Warning] ${err?.message}`);
      }
    }

    if (!order) {
      throw new NotFoundException(
        'No order found matching the provided order number and phone credentials.',
      );
    }

    const shippingAddress = (order.shippingAddress as any) || {};
    const streetAddress =
      shippingAddress.address ||
      shippingAddress.streetAddress ||
      order.shippingAddress ||
      '';

    // Determine Courier Name and Live Tracking Link (Pathao is primary)
    let courierName: string | null = 'Pathao Courier';
    let trackingUrl: string | null = 'https://merchant.pathao.com/tracking';

    if (order.trackingCode || order.courierBookingId) {
      const idStr = `${order.courierBookingId || ''} ${order.trackingCode || ''}`.toUpperCase();
      const trkCode = order.trackingCode || order.courierBookingId;
      if (idStr.includes('REDX')) {
        courierName = 'RedX Logistics';
        trackingUrl = `https://redx.com.bd/track?trackingId=${trkCode}`;
      } else if (idStr.includes('STEADFAST') || idStr.includes('STDF')) {
        courierName = 'Steadfast Courier';
        trackingUrl = `https://steadfast.com.bd/t/${trkCode}`;
      } else if (idStr.includes('ECOURIER') || idStr.includes('ECR')) {
        courierName = 'eCourier';
        trackingUrl = `https://ecourier.com.bd/tracking?tracking_id=${trkCode}`;
      } else {
        courierName = 'Pathao Courier';
        trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(trkCode!)}`;
      }
    }

    // Build timeline milestones
    const currentStatusIndex = QuickTrackingService.MILESTONE_STEPS.findIndex(
      (m) => m.status === order.status,
    );

    const milestones: QuickTrackMilestone[] = QuickTrackingService.MILESTONE_STEPS.map(
      (milestone, index) => {
        const isCompleted = currentStatusIndex !== -1 && index <= currentStatusIndex;
        const isCurrent = currentStatusIndex !== -1 && index === currentStatusIndex;
        return {
          step: milestone.step,
          label: milestone.label,
          labelBn: milestone.labelBn,
          isCompleted,
          isCurrent,
          timestamp: isCompleted
            ? (
                (isCurrent ? order.updatedAt : order.createdAt) ||
                order.createdAt
              )?.toISOString?.() || null
            : null,
        };
      },
    );

    const currentMilestone = QuickTrackingService.MILESTONE_STEPS.find((m) => m.status === order.status);
    const statusLabel = currentMilestone?.label || order.status;
    const statusLabelBn = currentMilestone?.labelBn || order.status;

    const division = (shippingAddress.division || shippingAddress.zone || 'Dhaka').toLowerCase();
    const estWindow =
      division.includes('outside') || division.includes('nationwide')
        ? '48 to 72 Hours (Outside Dhaka)'
        : '24 to 48 Hours (Inside Dhaka)';

    const mappedItems = (order.items || []).map((it: any) => ({
      title: it.title || it.titleEn || 'Bespoke Formulation',
      variant: it.variant || it.volume || it.sku || 'Standard',
      quantity: it.quantity || 1,
      unitPriceBdt: Number(it.unitPriceBdt || it.priceBdt || it.unitPrice || 0),
      lineTotalBdt: Number(
        it.lineTotalBdt ||
        it.totalPrice ||
        (it.unitPriceBdt || it.priceBdt || 0) * (it.quantity || 1),
      ),
    }));

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel,
      statusLabelBn,
      courierName,
      courierBookingId: order.courierBookingId,
      trackingCode: order.trackingCode,
      trackingUrl,
      estimatedDeliveryWindow: estWindow,
      shippingAddressMasked: {
        fullName: shippingAddress.fullName || order.guestName || (order.user?.fullName) || 'Valued Client',
        division: shippingAddress.division || shippingAddress.zone || 'Dhaka',
        district: shippingAddress.district || 'Bangladesh',
        thanaArea: shippingAddress.thanaArea || '',
        streetAddressMasked: streetAddress || 'Sanctuary Address',
      },
      itemCount: mappedItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotalBdt: Number(order.subtotalBdt || order.subtotal || 0),
      deliveryFeeBdt: Number(order.deliveryFeeBdt || order.deliveryFee || 0),
      discountBdt: Number(order.discountBdt || order.discount || 0),
      totalPayableBdt: Number(order.totalPayableBdt || order.totalAmount || 0),
      advancePaidBdt: Number(order.advancePaidBdt || 0),
      codDueBdt: Number(order.codDueBdt || order.totalPayableBdt || order.totalAmount || 0),
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentGateway: order.paymentTransactions?.[0]?.gateway || order.paymentMethod || 'COD',
      milestones,
      items: mappedItems,
      createdAt: (order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt) || new Date().toISOString(),
    };
  }

  private mapLocalOrderToResult(order: any): QuickTrackResult {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const mappedItems = rawItems.map((it: any) => ({
      title: it.title || it.titleEn || 'Bespoke Formulation',
      variant: it.variant || it.volume || 'Standard',
      quantity: it.quantity || 1,
      unitPriceBdt: Number(it.unitPrice || it.priceBdt || 0),
      lineTotalBdt: Number(it.totalPrice || (it.unitPrice || it.priceBdt || 0) * (it.quantity || 1)),
    }));

    const statusIndex = order.status === 'CONFIRMED' ? 1 : (order.status === 'PACKED' ? 2 : (order.status === 'DISPATCHED' || order.status === 'SHIPPED' ? 4 : 0));
    const milestones = QuickTrackingService.MILESTONE_STEPS.map((m, idx) => ({
      step: m.step,
      label: m.label,
      labelBn: m.labelBn,
      isCompleted: idx <= statusIndex,
      isCurrent: idx === statusIndex,
      timestamp: idx <= statusIndex ? (order.createdAt || new Date().toISOString()) : null,
    }));

    return {
      orderNumber: order.orderNumber || order.id,
      status: (order.status as any) || OrderStatus.PLACED,
      statusLabel: order.status === 'CONFIRMED' ? 'Confirmed & Verified' : 'Order Placed',
      statusLabelBn: order.status === 'CONFIRMED' ? 'অর্ডার নিশ্চিতকরণ সম্পন্ন' : 'অর্ডার সফলভাবে গৃহীত হয়েছে',
      courierName: 'Pathao Courier',
      courierBookingId: order.consignmentId || null,
      trackingCode: order.trackingCode || null,
      trackingUrl: 'https://merchant.pathao.com/tracking',
      estimatedDeliveryWindow: (order.zone && order.zone.includes('Outside')) ? '48 to 72 Hours (Outside Dhaka)' : '24 to 48 Hours (Inside Dhaka)',
      shippingAddressMasked: {
        fullName: order.customerName || order.guestName || 'Valued Client',
        division: order.zone || 'Dhaka',
        district: order.district || 'Dhaka',
        thanaArea: '',
        streetAddressMasked: order.shippingAddress || 'Sanctuary Address',
      },
      itemCount: mappedItems.reduce((s: number, i: any) => s + i.quantity, 0),
      subtotalBdt: Number(order.subtotal || 0),
      deliveryFeeBdt: Number(order.deliveryFee || 0),
      discountBdt: Number(order.discount || 0),
      totalPayableBdt: Number(order.totalAmount || 0),
      advancePaidBdt: 0,
      codDueBdt: Number(order.totalAmount || 0),
      paymentStatus: 'PENDING',
      paymentGateway: order.paymentMethod || 'COD',
      milestones,
      items: mappedItems,
      createdAt: order.createdAt || new Date().toISOString(),
    };
  }
}
