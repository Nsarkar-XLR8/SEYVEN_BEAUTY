import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, RmaStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { GeoZoneService } from '../checkout/services/geo-zone.service';
import { GdprDeleteAccountDto } from './dto/gdpr-delete.dto';
import { ManageAddressesDto } from './dto/manage-addresses.dto';
import { QuickTrackQueryDto } from './dto/quick-track.dto';
import {
  Customer360Dossier,
  CustomerProfileSummary,
  GdprExportArchive,
  QuickTrackResult,
} from './interfaces/customer.interface';
import { Customer360Service } from './services/customer-360.service';
import { GdprService } from './services/gdpr.service';
import { QuickTrackingService } from './services/quick-tracking.service';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geoZoneService: GeoZoneService,
    private readonly quickTrackingService: QuickTrackingService,
    private readonly customer360Service: Customer360Service,
    private readonly gdprService: GdprService,
  ) {}

  /**
   * Guest & Authenticated Self-Serve Instant Order Tracker.
   */
  async quickTrack(query: QuickTrackQueryDto): Promise<QuickTrackResult> {
    return this.quickTrackingService.quickTrackOrder(
      query.orderNumber,
      query.phone,
    );
  }

  /**
   * Retrieves authenticated customer profile summary including dermal quiz history,
   * saved address book, loyalty ledger, active orders, and active RMA tickets.
   */
  async getProfile(userId: string): Promise<CustomerProfileSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        loyaltyAccount: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer account with ID ${userId} not found`);
    }

    // Orders summary
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalPayableBdt: true,
        trackingCode: true,
        createdAt: true,
      },
    });

    const activeStatuses: OrderStatus[] = [
      OrderStatus.PLACED,
      OrderStatus.CONFIRMED,
      OrderStatus.PACKED,
      OrderStatus.BOOKED,
      OrderStatus.SHIPPED,
    ];

    const activeOrdersCount = orders.filter((o) =>
      activeStatuses.includes(o.status),
    ).length;
    const deliveredOrdersCount = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    ).length;

    // Active RMA requests
    const activeRmaStatuses: RmaStatus[] = [
      RmaStatus.SUBMITTED,
      RmaStatus.UNDER_INSPECTION,
      RmaStatus.APPROVED,
    ];

    const activeRmas = await this.prisma.rmaRequest.findMany({
      where: {
        userId,
        status: { in: activeRmaStatuses },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rmaNumber: true,
        status: true,
        primaryReason: true,
        requestedAmountBdt: true,
        approvedRefundAmountBdt: true,
        createdAt: true,
      },
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt.toISOString(),
      },
      savedAddresses: user.addresses.map((a) => ({
        id: a.id,
        division: a.division,
        district: a.district,
        thanaArea: a.thanaArea,
        courierZoneId: a.courierZoneId,
        streetAddress: a.streetAddress,
        landmark: a.landmark,
        isDefault: a.isDefault,
        createdAt: a.createdAt.toISOString(),
      })),
      loyalty: {
        isRepeatClient: deliveredOrdersCount > 0 || orders.length > 0,
        privilegeDiscountPercent: (deliveredOrdersCount > 0 || orders.length > 0) ? 5 : 0,
      },
      ordersSummary: {
        totalOrdersCount: orders.length,
        activeOrdersCount,
        deliveredOrdersCount,
        recentOrders: orders.slice(0, 5).map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalPayableBdt: Number(o.totalPayableBdt),
          courierTrackingCode: o.trackingCode,
          createdAt: o.createdAt.toISOString(),
        })),
      },
      activeRmaTickets: activeRmas.map((r) => ({
        id: r.id,
        rmaNumber: r.rmaNumber,
        status: r.status,
        reason: r.primaryReason,
        refundAmountBdt: Number(r.approvedRefundAmountBdt ?? r.requestedAmountBdt),
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Multi-address saved address book management.
   * Auto-resolves CourierZoneId using GeoZoneService when omitted.
   */
  async manageAddresses(userId: string, dto: ManageAddressesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Customer account with ID ${userId} not found`);
    }

    // Determine default index: first item explicitly marked default, or fallback to index 0
    let defaultIndex = dto.addresses.findIndex((a) => a.isDefault === true);
    if (defaultIndex === -1) {
      defaultIndex = 0;
    }

    const savedList = await this.prisma.$transaction(async (tx) => {
      // Clear previous addresses
      await tx.userAddress.deleteMany({ where: { userId } });

      // Create new list
      for (let idx = 0; idx < dto.addresses.length; idx++) {
        const item = dto.addresses[idx];
        const isDefault = idx === defaultIndex;

        // Auto-resolve courier zone ID if absent or 0
        let zoneId = item.courierZoneId;
        if (!zoneId || zoneId <= 0) {
          const resolved = this.geoZoneService.resolveCourierZone(
            item.division,
            item.district,
            item.thanaArea,
          );
          zoneId = resolved.courierZoneId;
        }

        await tx.userAddress.create({
          data: {
            userId,
            division: item.division.trim(),
            district: item.district.trim(),
            thanaArea: item.thanaArea.trim(),
            courierZoneId: zoneId,
            streetAddress: item.streetAddress.trim(),
            landmark: item.landmark ? item.landmark.trim() : null,
            isDefault,
          },
        });
      }

      return tx.userAddress.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });

    return {
      success: true,
      count: savedList.length,
      addresses: savedList,
    };
  }

  /**
   * Admin / Customer Care 360 intelligence dossier.
   */
  async getCustomer360(customerId: string): Promise<Customer360Dossier> {
    return this.customer360Service.getCustomer360(customerId);
  }

  /**
   * Data portability & personal archive export.
   */
  async exportPersonalData(userId: string): Promise<GdprExportArchive> {
    return this.gdprService.exportPersonalData(userId);
  }

  /**
   * Right to erasure compliance.
   */
  async executeRightToErasure(
    userId: string,
    dto: GdprDeleteAccountDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.gdprService.executeRightToErasure(
      userId,
      dto,
      ipAddress,
      userAgent,
    );
  }
}
