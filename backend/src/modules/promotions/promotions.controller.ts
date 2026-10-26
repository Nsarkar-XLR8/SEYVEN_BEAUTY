import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApplyCouponDto, DetachCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { ActivePromotionItem, CouponValidationResult } from './interfaces/promotion.interface';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions & Vouchers Engine')
@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('coupons/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate promo coupon code against cart rules & anti-stacking limits',
    description:
      'Evaluates minimum order threshold, first-order criteria, expiration, user usage limits, and anti-stacking policies to calculate the discount value.',
  })
  @ApiResponse({ status: 200, description: 'Coupon is valid and discount calculated' })
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
    @Req() req: Request,
  ): Promise<CouponValidationResult> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.promotionsService.validateCoupon(dto, userId);
  }

  @Post('cart/apply-coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply promotional coupon to active shopping cart',
    description:
      'Attaches voucher code to Redis cart, recalculates subtotal and payable total, and auto-injects GWP deluxe sample items if threshold is met.',
  })
  @ApiResponse({ status: 200, description: 'Coupon applied to cart successfully' })
  async applyCouponToCart(
    @Body() dto: ApplyCouponDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.promotionsService.applyCouponToCart(dto, userId);
  }

  @Delete('cart/coupon')
  @ApiOperation({
    summary: 'Remove attached promo coupon from shopping cart',
    description: 'Detaches voucher code and purges any auto-injected promotional GWP line items.',
  })
  @ApiResponse({ status: 200, description: 'Coupon detached from cart' })
  async removeCouponFromCart(
    @Query() query: DetachCouponDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.promotionsService.removeCouponFromCart(query.guestToken, userId);
  }

  @Get('promotions/active')
  @ApiOperation({
    summary: 'Get list of active storefront promotional campaigns and GWP tiers',
    description: 'Returns live promotional banners, threshold rules, and flash campaign metadata.',
  })
  @ApiResponse({ status: 200, description: 'Active promotions list returned' })
  async getActivePromotions(): Promise<ActivePromotionItem[]> {
    return this.promotionsService.getActivePromotions();
  }

  @Get('promotions/festival-campaign')
  @ApiOperation({
    summary: 'Get live active Seasonal Festival Courtesy Campaign (Eid, Puja, Winter Glow)',
    description: 'Returns automatic zero-coupon courtesy campaign details and live discount status.',
  })
  async getActiveFestivalCampaign(@Query('subtotal') subtotal?: number) {
    return this.promotionsService.getActiveFestivalCampaign(subtotal ? Number(subtotal) : 0);
  }

  @Get('promotions/festival-campaigns')
  @ApiOperation({
    summary: 'Admin list of all festival campaigns (Eid-ul-Fitr, Durga Puja, etc.)',
  })
  async listFestivalCampaigns() {
    return this.promotionsService.listFestivalCampaigns();
  }
}
