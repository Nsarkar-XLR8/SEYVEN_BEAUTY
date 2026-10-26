import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { ReplenishmentQueryDto } from './dto/replenishment-query.dto';
import {
  LoyaltyBalanceResponse,
  LoyaltyTransactionType,
  RedeemPointsResult,
  ReplenishmentPrediction,
  TierStatusResponse,
  VipTier,
} from './interfaces/loyalty.interface';
import { ReplenishmentEngineService } from './services/replenishment-engine.service';
import { TierCalculatorService } from './services/tier-calculator.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tierCalculator: TierCalculatorService,
    private readonly replenishmentEngine: ReplenishmentEngineService,
  ) {}

  /**
   * Retrieves or automatically initializes a customer's loyalty ledger account.
   */
  async getOrCreateAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await this.prisma.loyaltyAccount.create({
        data: {
          userId,
          pointsBalance: 0,
          lifetimePoints: 0,
          tier: 'BRONZE',
        },
      });
      this.logger.log(`Initialized Loyalty Account for user ${userId}`);
    }

    return account;
  }

  /**
   * Returns current loyalty points balance, tier privileges, and recent ledger history.
   */
  async getBalance(userId: string): Promise<LoyaltyBalanceResponse> {
    const account = await this.getOrCreateAccount(userId);
    const tier = account.tier as VipTier;
    const tierPerks = this.tierCalculator.getTierPerks(tier);

    const recentTransactions = await (this.prisma as any).loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      accountId: account.id,
      userId: account.userId,
      pointsBalance: account.pointsBalance,
      monetaryValueBdt: this.tierCalculator.calculateMonetaryValueBdt(
        account.pointsBalance,
      ),
      lifetimePoints: account.lifetimePoints,
      currentTier: tier,
      tierPerks,
      recentTransactions: (recentTransactions || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        points: tx.points,
        runningBalance: tx.runningBalance,
        description: tx.description,
        orderId: tx.orderId,
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Returns VIP tier threshold progression towards next tier.
   */
  async getTierStatus(userId: string): Promise<TierStatusResponse> {
    const account = await this.getOrCreateAccount(userId);
    return this.tierCalculator.calculateNextTierProgress(
      account.lifetimePoints,
    );
  }

  /**
   * Redeems loyalty points for an immediate monetary order discount at checkout.
   * Business guard: Max redemption limit capped at 30% of total cart value.
   */
  async redeemPoints(
    userId: string,
    dto: RedeemPointsDto,
  ): Promise<RedeemPointsResult> {
    const account = await this.getOrCreateAccount(userId);

    if (account.pointsBalance < dto.pointsToRedeem) {
      throw new BadRequestException(
        `Insufficient points balance. You requested ${dto.pointsToRedeem} points, but your available balance is ${account.pointsBalance} points.`,
      );
    }

    // 10 points = 1 BDT
    const discountAmountBdt =
      this.tierCalculator.calculateMonetaryValueBdt(dto.pointsToRedeem);

    // Business Guard: Maximum allowable redemption is 30% of cart total
    const maxAllowedDiscountBdt =
      Math.floor(dto.cartTotalBdt * 0.3 * 100) / 100;
    if (discountAmountBdt > maxAllowedDiscountBdt) {
      throw new BadRequestException(
        `Redemption discount (৳${discountAmountBdt}) exceeds the maximum allowable limit of 30% of cart value (৳${maxAllowedDiscountBdt}). Please redeem fewer points.`,
      );
    }

    const newPointsBalance = account.pointsBalance - dto.pointsToRedeem;

    await this.prisma.$transaction(async (tx: any) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newPointsBalance,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: LoyaltyTransactionType.REDEEMED_CHECKOUT,
          points: -dto.pointsToRedeem,
          runningBalance: newPointsBalance,
          description: `Redeemed ${dto.pointsToRedeem} points for ৳${discountAmountBdt} checkout discount`,
        },
      });
    });

    const adjustedCartTotalBdt = Math.max(
      0,
      Math.round((dto.cartTotalBdt - discountAmountBdt) * 100) / 100,
    );

    return {
      success: true,
      pointsRedeemed: dto.pointsToRedeem,
      discountAmountBdt,
      remainingPointsBalance: newPointsBalance,
      originalCartTotalBdt: dto.cartTotalBdt,
      adjustedCartTotalBdt,
    };
  }

  /**
   * Points Earn Engine: Credits points upon verified order delivery.
   * Strictly derived from delivered orders. Updates VIP tier progression.
   */
  async earnPointsForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.userId) {
      return null; // Guest orders or non-existent orders do not earn VIP ledger points
    }

    // Prevent duplicate earning for the same order
    const existingEarnTx = await (this.prisma as any).loyaltyTransaction.findFirst({
      where: {
        orderId,
        type: LoyaltyTransactionType.EARNED_PURCHASE,
      },
    });

    if (existingEarnTx) {
      this.logger.warn(`Points already awarded for delivered order ${order.orderNumber}`);
      return existingEarnTx;
    }

    const account = await this.getOrCreateAccount(order.userId);
    const tier = account.tier as VipTier;

    // Calculate points based on order net payable amount and tier multiplier
    const pointsEarned = this.tierCalculator.calculatePointsEarned(
      Number(order.totalPayableBdt),
      tier,
    );

    if (pointsEarned <= 0) return null;

    const newPointsBalance = account.pointsBalance + pointsEarned;
    const newLifetimePoints = account.lifetimePoints + pointsEarned;
    const updatedTier = this.tierCalculator.calculateTier(newLifetimePoints);

    const transaction = await this.prisma.$transaction(async (tx: any) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newPointsBalance,
          lifetimePoints: newLifetimePoints,
          tier: updatedTier,
        },
      });

      return tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          orderId,
          type: LoyaltyTransactionType.EARNED_PURCHASE,
          points: pointsEarned,
          runningBalance: newPointsBalance,
          description: `Earned ${pointsEarned} points from delivered order ${order.orderNumber} (${tier} tier)`,
        },
      });
    });

    this.logger.log(
      `Awarded ${pointsEarned} points to user ${order.userId} for order ${order.orderNumber}. New Tier: ${updatedTier}`,
    );

    return transaction;
  }

  /**
   * Points Clawback Engine: Deducts earned points proportionally when orders/items are returned.
   */
  async clawbackPointsForReturn(orderId: string, refundAmountBdt: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.userId) return null;

    const originalEarnTx = await (this.prisma as any).loyaltyTransaction.findFirst({
      where: {
        orderId,
        type: LoyaltyTransactionType.EARNED_PURCHASE,
      },
    });

    if (!originalEarnTx || originalEarnTx.points <= 0) return null;

    const totalPayable = Number(order.totalPayableBdt);
    if (totalPayable <= 0) return null;

    // Proportionally clawback points based on refund percentage
    const ratio = Math.min(1.0, refundAmountBdt / totalPayable);
    const pointsToClawback = Math.max(1, Math.round(originalEarnTx.points * ratio));

    const account = await this.getOrCreateAccount(order.userId);
    const newPointsBalance = Math.max(0, account.pointsBalance - pointsToClawback);

    return this.prisma.$transaction(async (tx: any) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: newPointsBalance,
        },
      });

      return tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          orderId,
          type: LoyaltyTransactionType.CLAWBACK_RETURN,
          points: -pointsToClawback,
          runningBalance: newPointsBalance,
          description: `Clawback ${pointsToClawback} points due to RMA return / refund of ৳${refundAmountBdt} on order ${order.orderNumber}`,
        },
      });
    });
  }

  /**
   * Predictive replenishment reorder triggers.
   */
  async getReplenishmentPredictions(
    query: ReplenishmentQueryDto,
  ): Promise<{ total: number; predictions: ReplenishmentPrediction[] }> {
    return this.replenishmentEngine.getReplenishmentPredictions(query);
  }
}
