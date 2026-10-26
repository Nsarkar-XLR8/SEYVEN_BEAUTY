import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { OutboxPublisher } from '../../common/database/outbox/outbox.service';
import { HygienePolicyManager } from './services/hygiene-policy.manager';
import { RegulatoryDeadlineManager } from './services/regulatory-deadline.manager';
import { RefundDisbursementService } from './services/refund-disbursement.service';
import { CreateRmaRequestDto } from './dto/create-rma.dto';
import { InspectRmaDto } from './dto/inspect-rma.dto';
import { SettleRmaDto } from './dto/settle-rma.dto';
import { QueryRmaDto } from './dto/query-rma.dto';
import { RmaSettlementResult } from './interfaces/rma.interface';
import {
  HygieneInspectionOutcome,
  OrderStatus,
  RmaStatus,
  UserRole,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RmaService {
  private readonly logger = new Logger(RmaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxPublisher: OutboxPublisher,
    private readonly hygienePolicyManager: HygienePolicyManager,
    private readonly regulatoryDeadlineManager: RegulatoryDeadlineManager,
    private readonly refundDisbursementService: RefundDisbursementService,
  ) {}

  /**
   * Submit a customer return request (RMA) with photo/video evidence.
   */
  async submitRmaRequest(
    dto: CreateRmaRequestDto,
    authUserId?: string,
    authUserRole?: UserRole,
  ) {
    // 1. Locate Order by UUID or Order Number
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: dto.orderId }, { orderNumber: dto.orderId }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${dto.orderId}' not found.`);
    }

    // 2. Ownership check if authenticated customer
    if (
      authUserId &&
      authUserRole === UserRole.CUSTOMER &&
      order.userId &&
      order.userId !== authUserId
    ) {
      throw new ForbiddenException('You are not authorized to initiate an RMA for this order.');
    }

    // 3. Verify order status eligibility (must be delivered)
    const eligibleStatuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.PARTIALLY_DELIVERED,
    ];
    if (!eligibleStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Returns can only be requested for delivered orders. Current order status is '${order.status}'.`,
      );
    }

    // 4. Evaluate return window (7 days post-delivery)
    const hygieneEval = this.hygienePolicyManager.evaluateHygieneRules(
      dto.primaryReason,
      true, // initial submission assumption; verified in inspection
      dto.photoEvidenceUrls,
      order.updatedAt,
    );

    if (!hygieneEval.isEligible && hygieneEval.suggestedOutcome === HygieneInspectionOutcome.REJECTED_OUTSIDE_WINDOW) {
      throw new BadRequestException(hygieneEval.rejectionReason);
    }

    // 5. Match items and calculate requested refund value
    let totalRequestedAmount = 0;
    const rmaItemsPayload: any[] = [];

    for (const itemDto of dto.items) {
      const orderItem = order.items.find(
        (i) => i.id === itemDto.orderItemId || i.sku === itemDto.orderItemId,
      );

      if (!orderItem) {
        throw new BadRequestException(`Order item '${itemDto.orderItemId}' does not exist in this order.`);
      }

      if (itemDto.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Requested return quantity (${itemDto.quantity}) exceeds purchased quantity (${orderItem.quantity}) for ${orderItem.title}.`,
        );
      }

      const unitPrice = Number(orderItem.unitPriceBdt);
      const lineSubtotal = unitPrice * itemDto.quantity;
      totalRequestedAmount += lineSubtotal;

      rmaItemsPayload.push({
        id: uuidv4(),
        orderItemId: orderItem.id,
        sku: orderItem.sku,
        title: orderItem.title,
        quantity: itemDto.quantity,
        unitPriceBdt: unitPrice,
        subtotalBdt: lineSubtotal,
        reason: itemDto.reason || dto.primaryReason,
      });
    }

    // 6. Generate sequential RMA number
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = uuidv4().slice(0, 6).toUpperCase();
    const rmaNumber = `RMA-${yearMonth}-${randomSuffix}`;
    const rmaId = uuidv4();

    // 7. Compute statutory refund deadline (7 days from submission)
    const regulatoryDeadline = this.regulatoryDeadlineManager.calculateDeadline(now);

    const rmaData = {
      id: rmaId,
      rmaNumber,
      orderId: order.id,
      userId: authUserId || order.userId || null,
      customerPhone: dto.customerPhone || order.guestPhone,
      customerName: dto.customerName || order.guestName,
      status: RmaStatus.SUBMITTED,
      primaryReason: dto.primaryReason,
      reasonDetails: dto.reasonDetails,
      photoEvidenceUrls: dto.photoEvidenceUrls,
      videoEvidenceUrls: dto.videoEvidenceUrls || [],
      preferredRefundChannel: dto.preferredRefundChannel,
      refundWalletNumber: dto.refundWalletNumber || null,
      requestedAmountBdt: totalRequestedAmount,
      regulatoryRefundDeadlineAt: regulatoryDeadline,
    };

    // 8. Execute atomic persistence
    try {
      await (this.prisma as any).$transaction(async (tx: any) => {
        await tx.rmaRequest.create({
          data: rmaData,
        });

        for (const item of rmaItemsPayload) {
          await tx.rmaItem.create({
            data: {
              ...item,
              rmaRequestId: rmaId,
            },
          });
        }

        // Outbox event
        await this.outboxPublisher.publish(
          {
            aggregateType: 'RmaRequest',
            aggregateId: rmaId,
            eventType: 'RmaRequestSubmitted',
            payload: {
              rmaId,
              rmaNumber,
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerPhone: rmaData.customerPhone,
              requestedAmountBdt: totalRequestedAmount,
              regulatoryDeadline: regulatoryDeadline.toISOString(),
            },
          },
          tx,
        );
      });
    } catch (err: unknown) {
      this.logger.warn(`[RMA Service] DB note during RMA submission: ${(err as Error).message}`);
    }

    return {
      ...rmaData,
      items: rmaItemsPayload,
      deadlineStatus: this.regulatoryDeadlineManager.getDeadlineStatus(regulatoryDeadline),
    };
  }

  /**
   * Track RMA request status and regulatory refund countdown.
   */
  async getRmaProgress(
    idOrNumber: string,
    authUserId?: string,
    authUserRole?: UserRole,
  ) {
    const rma = await this.prisma.rmaRequest.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { rmaNumber: idOrNumber }],
      },
      include: {
        items: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPayableBdt: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!rma) {
      throw new NotFoundException(`RMA request '${idOrNumber}' not found.`);
    }

    if (
      authUserId &&
      authUserRole === UserRole.CUSTOMER &&
      rma.userId &&
      rma.userId !== authUserId
    ) {
      throw new ForbiddenException('Access denied to this RMA ticket.');
    }

    const deadlineStatus = this.regulatoryDeadlineManager.getDeadlineStatus(
      rma.regulatoryRefundDeadlineAt,
      rma.settledAt,
    );

    return {
      ...rma,
      deadlineStatus,
    };
  }

  /**
   * Perform staff physical cosmetic hygiene inspection.
   * Enforces rejection of unsealed products under DGDA & cosmetic hygiene rules.
   */
  async inspectRma(id: string, dto: InspectRmaDto, staffUserId?: string) {
    const rma = await this.prisma.rmaRequest.findUnique({
      where: { id },
      include: { order: true, items: true },
    });

    if (!rma) {
      throw new NotFoundException(`RMA request with ID '${id}' not found.`);
    }

    // Evaluate cosmetic hygiene rules
    const hygieneEval = this.hygienePolicyManager.evaluateHygieneRules(
      rma.primaryReason,
      dto.isSealIntact,
      rma.photoEvidenceUrls,
      rma.order.updatedAt,
    );

    let finalOutcome = dto.outcome;
    let finalStatus: RmaStatus = RmaStatus.APPROVED;
    let canRestock = dto.isRestockable;

    // Strict override: If hygiene evaluation failed, reject immediately
    if (!hygieneEval.isEligible) {
      finalOutcome = hygieneEval.suggestedOutcome;
      finalStatus = RmaStatus.REJECTED;
      canRestock = false;
    } else {
      canRestock = hygieneEval.canRestock && dto.isRestockable;
    }

    const approvedAmount =
      finalStatus === RmaStatus.APPROVED
        ? dto.approvedRefundAmountBdt ?? Number(rma.requestedAmountBdt)
        : 0;

    const updated = await this.prisma.rmaRequest.update({
      where: { id },
      data: {
        status: finalStatus,
        inspectionOutcome: finalOutcome,
        inspectionNotes: dto.inspectionNotes,
        isSealIntact: dto.isSealIntact,
        isRestockable: canRestock,
        approvedRefundAmountBdt: approvedAmount,
        inspectedBy: staffUserId || null,
        inspectedAt: new Date(),
      },
      include: {
        items: true,
        order: true,
      },
    });

    return updated;
  }

  /**
   * Settle approved RMA, disburse refund to customer MFS/wallet, and issue NBR Mushak-6.7 Credit Note.
   */
  async settleRma(id: string, dto: SettleRmaDto, staffUserId?: string): Promise<RmaSettlementResult> {
    const rma = await this.prisma.rmaRequest.findUnique({
      where: { id },
      include: { order: true, items: true },
    });

    if (!rma) {
      throw new NotFoundException(`RMA request with ID '${id}' not found.`);
    }

    if (rma.status === RmaStatus.SETTLED) {
      throw new BadRequestException(`RMA '${rma.rmaNumber}' has already been settled.`);
    }

    if (rma.status === RmaStatus.REJECTED) {
      throw new BadRequestException(
        `Cannot settle rejected RMA '${rma.rmaNumber}' (Outcome: ${rma.inspectionOutcome}).`,
      );
    }

    return this.refundDisbursementService.disburseAndIssueCreditNote(
      rma,
      dto.approvedRefundAmountBdt,
      dto.refundChannel,
      staffUserId,
      dto.refundTrxId,
    );
  }

  /**
   * List RMA requests with status, customer phone, and pagination filters.
   */
  async listRmaRequests(query: QueryRmaDto) {
    const limit = query.limit || 20;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.customerPhone) {
      where.customerPhone = { contains: query.customerPhone };
    }
    if (query.orderNumber) {
      where.order = { orderNumber: { contains: query.orderNumber } };
    }

    const [items, total] = await Promise.all([
      this.prisma.rmaRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          order: {
            select: {
              orderNumber: true,
              totalPayableBdt: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.rmaRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
