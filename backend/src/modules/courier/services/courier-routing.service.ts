import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { PathaoService } from './pathao.service';
import { SteadfastService } from './steadfast.service';
import { CourierPartner, SmartDispatchDto } from '../dto/smart-dispatch.dto';
import { v4 as uuidv4 } from 'uuid';

export interface SmartDispatchResult {
  success: boolean;
  courier: CourierPartner;
  failover: boolean;
  orderId: string;
  consignmentId: string | number;
  trackingCode: string;
  primaryError?: string;
  data: any;
}

@Injectable()
export class CourierRoutingService {
  private readonly logger = new Logger(CourierRoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pathaoService: PathaoService,
    private readonly steadfastService: SteadfastService,
  ) {}

  /**
   * Returns current multi-courier routing configuration and hierarchy
   * Policy: Pathao is 1st choice (primary), Steadfast is backup (failover).
   */
  getRoutingPolicy() {
    return {
      primary: CourierPartner.PATHAO,
      backup: CourierPartner.STEADFAST,
      description:
        'Pathao is the primary courier partner. Steadfast serves as automated zero-downtime backup on any Pathao booking failure or zone unserviceability.',
    };
  }

  /**
   * Smartly dispatches an order adhering to:
   * 1. Pathao as first choice (Primary)
   * 2. Steadfast as backup (Automated failover on failure)
   */
  async dispatchOrder(
    dto: SmartDispatchDto,
    staffUserId?: string,
  ): Promise<SmartDispatchResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${dto.orderId}' not found`);
    }

    const preferred = dto.preferredCourier || CourierPartner.PATHAO;

    if (preferred === CourierPartner.STEADFAST) {
      // Operator explicitly selected Steadfast
      this.logger.log(
        `[Courier Router] Direct dispatch to STEADFAST requested for order ${order.orderNumber}`,
      );
      return this.dispatchToSteadfast(order.id, dto, staffUserId, false);
    }

    // Default & Primary Path: Attempt Pathao first
    try {
      this.logger.log(
        `[Courier Router] Attempting primary carrier (PATHAO) for order ${order.orderNumber}`,
      );

      const pathaoRes = await this.pathaoService.bookConsignment(
        {
          orderId: dto.orderId,
          specialInstruction: dto.specialInstruction,
          itemWeightKg: dto.itemWeightKg,
          recipientCityId: dto.recipientCityId,
          recipientZoneId: dto.recipientZoneId,
          recipientAreaId: dto.recipientAreaId,
        },
        staffUserId,
      );

      const consignmentId = pathaoRes?.data?.consignment_id;
      return {
        success: true,
        courier: CourierPartner.PATHAO,
        failover: false,
        orderId: order.id,
        consignmentId,
        trackingCode: consignmentId,
        data: pathaoRes,
      };
    } catch (primaryError: any) {
      const errorMsg = primaryError?.message || String(primaryError);

      this.logger.warn(
        `⚠️ [Courier Router] Primary courier (PATHAO) dispatch failed for order ${order.orderNumber}: ${errorMsg}. Initiating automated failover to backup courier (STEADFAST)...`,
      );

      // Automated Failover to Steadfast
      try {
        const steadfastResult = await this.dispatchToSteadfast(
          order.id,
          dto,
          staffUserId,
          true,
          errorMsg,
        );
        return steadfastResult;
      } catch (backupError: any) {
        const backupMsg = backupError?.message || String(backupError);
        this.logger.error(
          `🚨 [Courier Router] Both primary (PATHAO) and backup (STEADFAST) failed for order ${order.orderNumber}. Pathao error: ${errorMsg} | Steadfast error: ${backupMsg}`,
        );

        throw new BadRequestException(
          `Multi-courier dispatch failed. Primary (Pathao): ${errorMsg}. Backup (Steadfast): ${backupMsg}`,
        );
      }
    }
  }

  private async dispatchToSteadfast(
    orderId: string,
    dto: SmartDispatchDto,
    staffUserId?: string,
    isFailover = false,
    primaryErrorMsg?: string,
  ): Promise<SmartDispatchResult> {
    const steadfastRes = await this.steadfastService.bookConsignment(
      {
        orderId,
        specialInstruction: dto.specialInstruction,
        itemWeightKg: dto.itemWeightKg,
      },
      staffUserId,
    );

    const consignment = steadfastRes.consignment;
    const consignmentId = consignment.consignment_id;
    const trackingCode = consignment.tracking_code || `SF${consignmentId}`;

    if (isFailover) {
      // Record immutable audit log noting failover from Pathao to Steadfast
      await this.prisma.orderAuditLog.create({
        data: {
          id: uuidv4(),
          orderId,
          staffUserId: staffUserId || null,
          action: 'COURIER_FAILOVER',
          previousStatus: null,
          newStatus: null,
          reason: `Automated failover: Primary courier (Pathao) failed [${primaryErrorMsg}]. Dispatched to backup courier (Steadfast: #${consignmentId})`,
          metadata: {
            previousCourier: 'PATHAO',
            newCourier: 'STEADFAST',
            consignmentId: String(consignmentId),
            trackingCode,
            primaryError: primaryErrorMsg,
          },
        },
      });
    }

    return {
      success: true,
      courier: CourierPartner.STEADFAST,
      failover: isFailover,
      orderId,
      consignmentId,
      trackingCode,
      primaryError: primaryErrorMsg,
      data: steadfastRes,
    };
  }
}
