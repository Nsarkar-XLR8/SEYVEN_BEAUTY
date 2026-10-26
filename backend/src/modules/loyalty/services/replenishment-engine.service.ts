import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { ReplenishmentQueryDto } from '../dto/replenishment-query.dto';
import { ReplenishmentPrediction } from '../interfaces/loyalty.interface';

@Injectable()
export class ReplenishmentEngineService {
  private readonly logger = new Logger(ReplenishmentEngineService.name);

  // Standard cosmetic product lifespan benchmarks (single unit, regular compliance)
  private static readonly CATEGORY_LIFESPANS: {
    keyword: string;
    lifespanDays: number;
    category: string;
  }[] = [
    { keyword: 'sunscreen', lifespanDays: 30, category: 'Sun Protection' },
    { keyword: 'sunblock', lifespanDays: 30, category: 'Sun Protection' },
    { keyword: 'sun fluid', lifespanDays: 30, category: 'Sun Protection' },
    { keyword: 'spf', lifespanDays: 30, category: 'Sun Protection' },
    { keyword: 'serum', lifespanDays: 45, category: 'Targeted Treatment' },
    { keyword: 'ampoule', lifespanDays: 45, category: 'Targeted Treatment' },
    { keyword: 'cleanser', lifespanDays: 45, category: 'Cleanser' },
    { keyword: 'face wash', lifespanDays: 45, category: 'Cleanser' },
    { keyword: 'foam', lifespanDays: 45, category: 'Cleanser' },
    { keyword: 'toner', lifespanDays: 60, category: 'Toner & Prep' },
    { keyword: 'essence', lifespanDays: 60, category: 'Toner & Prep' },
    { keyword: 'cream', lifespanDays: 45, category: 'Moisturizer' },
    { keyword: 'moisturizer', lifespanDays: 45, category: 'Moisturizer' },
    { keyword: 'lotion', lifespanDays: 45, category: 'Moisturizer' },
    { keyword: 'mask', lifespanDays: 60, category: 'Special Care' },
    { keyword: 'scrub', lifespanDays: 60, category: 'Special Care' },
    { keyword: 'peel', lifespanDays: 60, category: 'Special Care' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Estimates product depletion lifecycle benchmark from title & category.
   */
  estimateProductLifespan(productTitle: string): {
    lifespanDays: number;
    category: string;
  } {
    const titleLower = productTitle.toLowerCase();
    for (const rule of ReplenishmentEngineService.CATEGORY_LIFESPANS) {
      if (titleLower.includes(rule.keyword)) {
        return { lifespanDays: rule.lifespanDays, category: rule.category };
      }
    }
    return { lifespanDays: 45, category: 'General Skincare' };
  }

  /**
   * Generates predictive replenishment reminders for delivered orders.
   * Identifies customers running low on previously purchased skincare regimens.
   */
  async getReplenishmentPredictions(
    query: ReplenishmentQueryDto,
  ): Promise<{ total: number; predictions: ReplenishmentPrediction[] }> {
    const dueWithinDays = query.dueWithinDays ?? 14;
    const limit = query.limit ?? 50;

    // Fetch delivered orders with items and user details
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    const now = new Date();
    const predictions: ReplenishmentPrediction[] = [];

    for (const order of deliveredOrders) {
      const deliveredAt = order.updatedAt || order.createdAt;
      const customerName =
        order.user?.fullName || order.guestName || 'Valued Customer';
      const customerPhone = order.user?.phone || order.guestPhone;
      const userId = order.userId || order.id;

      for (const item of order.items) {
        if (item.isGwp) continue; // Skip free promotional gifts

        const { lifespanDays: baseDays, category } = this.estimateProductLifespan(
          item.title,
        );
        // Multi-pack volume scaling (capped at 180 days max window)
        const totalLifespanDays = Math.min(180, baseDays * Math.max(1, item.quantity));

        const estimatedDepletionDate = new Date(deliveredAt.getTime());
        estimatedDepletionDate.setDate(
          estimatedDepletionDate.getDate() + totalLifespanDays,
        );

        const diffMs = estimatedDepletionDate.getTime() - now.getTime();
        const daysUntilDepletion = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Filter: only items due within target inspection window
        if (daysUntilDepletion <= dueWithinDays) {
          let status: 'OVERDUE' | 'DUE_SOON' | 'ACTIVE';
          if (daysUntilDepletion < 0) {
            status = 'OVERDUE';
          } else if (daysUntilDepletion <= 7) {
            status = 'DUE_SOON';
          } else {
            status = 'ACTIVE';
          }

          predictions.push({
            userId,
            customerName,
            customerPhone,
            orderId: order.id,
            orderNumber: order.orderNumber,
            deliveredAt: deliveredAt.toISOString(),
            productId: item.productId,
            productTitle: item.title,
            category,
            estimatedLifespanDays: totalLifespanDays,
            estimatedDepletionDate: estimatedDepletionDate.toISOString(),
            daysUntilDepletion,
            status,
            suggestedChannel: 'WHATSAPP',
          });
        }
      }
    }

    // Sort predictions: overdue and most urgent first
    predictions.sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion);

    const limitedPredictions = predictions.slice(0, limit);

    return {
      total: limitedPredictions.length,
      predictions: limitedPredictions,
    };
  }
}
