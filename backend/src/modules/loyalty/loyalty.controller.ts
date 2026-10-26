import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { ReplenishmentQueryDto } from './dto/replenishment-query.dto';
import { LoyaltyService } from './loyalty.service';

@ApiTags('Loyalty Points Ledger, VIP Tiering & Replenishment')
@Controller()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('loyalty/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer loyalty balance, monetary value, and tier perks',
    description:
      'Returns current available loyalty points balance, BDT cash discount purchasing value (10 points = 1 BDT), active VIP tier benefits, and recent ledger history.',
  })
  @ApiResponse({ status: 200, description: 'Loyalty balance and perks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Req() req: Request) {
    const authUser = (req as any).user;
    return this.loyaltyService.getBalance(authUser.id);
  }

  @Post('loyalty/redeem')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Redeem loyalty points for immediate cart discount at checkout',
    description:
      'Applies loyalty points discount to current checkout cart total. Enforces maximum redemption threshold of 30% of order value and deducts points from ledger atomically.',
  })
  @ApiResponse({ status: 200, description: 'Points redeemed and discount applied' })
  @ApiResponse({ status: 400, description: 'Insufficient points or exceeds 30% cart limit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async redeemPoints(@Req() req: Request, @Body() dto: RedeemPointsDto) {
    const authUser = (req as any).user;
    return this.loyaltyService.redeemPoints(authUser.id, dto);
  }

  @Get('loyalty/tier-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get VIP tier progression and milestone thresholds',
    description:
      'Returns the customer current VIP tier (BRONZE, SILVER, GOLD, NOIR), lifetime points progress percentage towards the next tier, points needed, and unlocked privileges.',
  })
  @ApiResponse({ status: 200, description: 'VIP tier progression' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTierStatus(@Req() req: Request) {
    const authUser = (req as any).user;
    return this.loyaltyService.getTierStatus(authUser.id);
  }

  @Get('admin/loyalty/replenishment-predictions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.CATALOG_MANAGER,
    UserRole.FINANCE_OFFICER,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Predictive product replenishment triggers (Staff/Admin)',
    description:
      'Algorithmically calculates cosmetic product depletion lifecycles based on delivered orders and purchase volumes (sunscreen: 30d, serum: 45d, toner: 60d). Triggers reorder reminders via WhatsApp/SMS.',
  })
  @ApiResponse({ status: 200, description: 'Replenishment prediction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getReplenishmentPredictions(@Query() query: ReplenishmentQueryDto) {
    return this.loyaltyService.getReplenishmentPredictions(query);
  }
}
