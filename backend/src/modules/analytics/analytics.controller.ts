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
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { MetaCapiWorker } from './workers/meta-capi.worker';
import { IngestAnalyticsEventDto } from './dto/analytics-event.dto';
import { AttributionQueryDto } from './dto/attribution-query.dto';
import {
  AttributionReportResponse,
  IngestAnalyticsEventResult,
} from './interfaces/analytics.interface';
import { MetaCapiDlqEntry } from './interfaces/meta-capi.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Marketing Analytics, Meta CAPI & Attribution')
@Controller()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly metaCapiWorker: MetaCapiWorker,
  ) {}

  @Post('analytics/events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Server-side marketing event ingestion (Meta CAPI & GA4 MP)',
    description:
      'Ingests browser and server-side marketing events (Purchase, AddToCart, InitiateCheckout, ViewContent, PageView). Enforces SHA-256 PII hashing, shared event_id deduplication, asynchronous Meta CAPI delivery, and GA4 Measurement Protocol dispatch.',
  })
  @ApiResponse({
    status: 200,
    description: 'Marketing event successfully ingested, hashed, and dispatched',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event payload or missing required parameters',
  })
  async ingestEvent(
    @Body() dto: IngestAnalyticsEventDto,
    @Req() req: Request,
  ): Promise<IngestAnalyticsEventResult> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Seyven-Browser/1.0';
    const userId = (req as any).user?.id;

    return this.analyticsService.ingestEvent(dto, clientIp, userAgent, userId);
  }

  @Get('admin/analytics/attribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_OFFICER,
    UserRole.CATALOG_MANAGER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'ROAS & multi-touch campaign attribution breakdown',
    description:
      'Computes multi-channel marketing attribution (first-touch, last-touch, linear) and campaign-level Return On Ad Spend (ROAS). Returns channel conversion volumes, revenue shares, blended ROAS, and conversion funnel metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Attribution report and ROAS breakdown retrieved successfully',
  })
  async getAttributionReport(
    @Query() query: AttributionQueryDto,
  ): Promise<AttributionReportResponse> {
    return this.analyticsService.getAttributionReport(query);
  }

  @Get('admin/analytics/capi/dlq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Inspect Meta CAPI Dead-Letter Queue (DLQ)',
    description:
      'Returns pending or exhausted failed Meta Conversions API events stored in the Redis Dead-Letter Queue for administrative diagnostics.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of dead-letter queue entries returned',
  })
  async getCapiDlq(
    @Query('limit') limit?: number,
  ): Promise<MetaCapiDlqEntry[]> {
    return this.metaCapiWorker.getDlqEntries(limit ? Number(limit) : 50);
  }
}
