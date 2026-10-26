import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateWaitlistSubscriptionDto } from '../dto/waitlist.dto';
import { PhoneUtils } from '../../../common/utils/phone.utils';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Subscribes a consumer for back-in-stock SMS & Email restock alerts.
   */
  async subscribe(productId: string, dto: CreateWaitlistSubscriptionDto, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variant with id "${dto.variantId}" not found`);
      }
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = PhoneUtils.normalize(dto.phone);
    } catch {
      throw new BadRequestException(`Invalid Bangladeshi phone number: ${dto.phone}`);
    }

    const waitlist = await (this.prisma as any).productWaitlist.create({
      data: {
        productId,
        variantId: dto.variantId,
        phone: normalizedPhone,
        email: dto.email,
        userId,
      },
    });

    this.logger.log(
      `🔔 [Waitlist Subscription] User ${normalizedPhone} subscribed for restock alert on product ${productId} (${product.titleEn})`,
    );

    return {
      waitlistId: waitlist.id,
      productId,
      variantId: dto.variantId,
      phone: normalizedPhone,
      status: 'SUBSCRIBED',
      message: 'You will receive an automated SMS notification as soon as this product is restocked.',
      createdAt: waitlist.createdAt,
    };
  }
}
