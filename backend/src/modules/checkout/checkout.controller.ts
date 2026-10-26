import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { CalculateCheckoutDto, CommitCheckoutDto } from './dto/checkout.dto';
import {
  CheckoutCalculationResult,
  CheckoutCommitResult,
  GeoDivision,
  GeoThana,
} from './interfaces/checkout.interface';
import { GeoZoneService } from './services/geo-zone.service';

@ApiTags('Express Checkout & Geo Zones')
@Controller()
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly geoZoneService: GeoZoneService,
  ) {}

  @Get('geo/zones')
  @ApiOperation({
    summary: 'Get hierarchical Bangladesh delivery divisions, districts & thanas',
    description:
      'Provides structured geographic location mappings with courier zone IDs for address dropdown selectors.',
  })
  @ApiQuery({
    name: 'district',
    required: false,
    description: 'Filter thanas for a specific district (e.g., Dhaka, Chittagong, Gazipur)',
  })
  @ApiResponse({ status: 200, description: 'Geographic zones returned' })
  getGeoZones(
    @Query('district') district?: string,
  ): GeoDivision[] | GeoThana[] {
    if (district) {
      return this.geoZoneService.getThanasForDistrict(district);
    }
    return this.geoZoneService.getAllDivisions();
  }

  @Post('checkout/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate live checkout financial totals & courier delivery charges',
    description:
      'Dynamically computes destination delivery charges, parcel weight surcharges, free shipping threshold (৳2,000), promo voucher discounts, and COD dues.',
  })
  @ApiResponse({ status: 200, description: 'Calculated checkout totals returned' })
  async calculateCheckout(
    @Body() dto: CalculateCheckoutDto,
    @Req() req: Request,
  ): Promise<CheckoutCalculationResult> {
    const user = (req as any).user;
    const userId = user?.userId;
    return this.checkoutService.calculateCheckout(dto, userId);
  }

  @Post('checkout/commit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit order with Redlock distributed locking & idempotency protection',
    description:
      'Creates customer order and line items, reserves physical inventory lots, logs digital consent, and publishes transactional outbox event. Guaranteed idempotent by X-Idempotency-Key header.',
  })
  @ApiHeader({
    name: 'x-idempotency-key',
    required: true,
    description: 'Unique client-generated UUID for preventing double submission',
  })
  @ApiResponse({ status: 201, description: 'Order placed successfully' })
  async commitCheckout(
    @Body() dto: CommitCheckoutDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Req() req: Request,
  ): Promise<CheckoutCommitResult> {
    const user = (req as any).user;
    const userId = user?.userId;
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'SEYVEN-Web';

    return this.checkoutService.commitCheckout(
      dto,
      idempotencyKey,
      ipAddress,
      userAgent,
      userId,
    );
  }
}
