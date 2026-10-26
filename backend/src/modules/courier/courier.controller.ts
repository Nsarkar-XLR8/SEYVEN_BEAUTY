import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SteadfastService } from './services/steadfast.service';
import { BookSteadfastConsignmentDto } from './dto/book-steadfast-consignment.dto';
import { SteadfastWebhookDto } from './dto/steadfast-webhook.dto';
import { SteadfastWebhookGuard } from './guards/steadfast-webhook.guard';
import { PathaoService } from './services/pathao.service';
import { BookPathaoConsignmentDto } from './dto/book-pathao-consignment.dto';
import { PathaoWebhookDto } from './dto/pathao-webhook.dto';
import { PathaoWebhookGuard } from './guards/pathao-webhook.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CourierRoutingService } from './services/courier-routing.service';
import { SmartDispatchDto } from './dto/smart-dispatch.dto';

@ApiTags('Courier Logistics & Inbound Webhooks (Steadfast & Pathao)')
@Controller()
export class CourierController {
  constructor(
    private readonly steadfastService: SteadfastService,
    private readonly pathaoService: PathaoService,
    private readonly courierRoutingService: CourierRoutingService,
  ) {}

  // ==========================================
  // STEADFAST COURIER ENDPOINTS (PHASE 19)
  // ==========================================

  @Post('courier/steadfast/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Book order consignment with Steadfast Courier',
    description:
      'Creates a physical shipment consignment with Steadfast Courier API (/create_order). Strictly passes order COD balance to cod_amount (৳0 for prepaid orders). Transitions order to BOOKED status and logs immutable audit trail.',
  })
  @ApiResponse({ status: 200, description: 'Consignment successfully booked with Steadfast' })
  @ApiResponse({ status: 400, description: 'Order not eligible for booking or already terminal' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async bookSteadfastConsignment(
    @Body() dto: BookSteadfastConsignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.steadfastService.bookConsignment(dto, user?.userId);
  }

  @Post('webhooks/courier/steadfast')
  @UseGuards(SteadfastWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inbound Steadfast Courier webhook listener (Delivery Status Sync)',
    description:
      'Receives and verifies real-time parcel delivery status updates from Steadfast. Validates HMAC signature, checks 7-day sliding window idempotency, and monotonically advances order status (SHIPPED, DELIVERED, RETURNED).',
  })
  @ApiResponse({ status: 200, description: 'Webhook ingested and state synchronized successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing Steadfast webhook signature' })
  async handleSteadfastWebhook(@Body() dto: SteadfastWebhookDto) {
    return this.steadfastService.handleInboundWebhook(dto);
  }

  @Get('courier/steadfast/tracking/:consignmentId')
  @ApiOperation({
    summary: 'Query live Steadfast consignment delivery status',
    description: 'Fetches real-time dispatch tracking, status, and milestone by consignment ID from Steadfast API.',
  })
  @ApiParam({ name: 'consignmentId', description: 'Steadfast Consignment ID', example: '9876543' })
  @ApiResponse({ status: 200, description: 'Tracking status returned successfully' })
  async getSteadfastTrackingStatus(@Param('consignmentId') consignmentId: string) {
    return this.steadfastService.getTrackingStatus(consignmentId);
  }

  @Get('admin/courier/steadfast/dlq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Inspect failed Steadfast courier dispatch Dead-Letter Queue (DLQ)',
    description: 'Lists Steadfast booking payloads that exhausted exponential retry attempts for staff remediation.',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max DLQ entries to return (default: 50)' })
  @ApiResponse({ status: 200, description: 'Dead-letter queue entries returned' })
  async getSteadfastDlqEntries(@Query('limit') limit?: number) {
    return this.steadfastService.getDlqEntries(limit ? Number(limit) : 50);
  }

  // ==========================================
  // PATHAO COURIER ENDPOINTS (PHASE 22)
  // ==========================================

  @Post('courier/pathao/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Book order consignment with Pathao Courier',
    description:
      'Creates a physical shipment consignment with Pathao Aladdin API. Strictly passes order COD balance to amount_to_collect (৳0 for prepaid orders). Transitions order to BOOKED status and logs immutable audit trail.',
  })
  @ApiResponse({ status: 200, description: 'Consignment successfully booked with Pathao' })
  @ApiResponse({ status: 400, description: 'Order not eligible for booking or already terminal' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async bookConsignment(
    @Body() dto: BookPathaoConsignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pathaoService.bookConsignment(dto, user?.userId);
  }

  @Post('webhooks/courier/pathao')
  @UseGuards(PathaoWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inbound Pathao Courier webhook listener (Delivery Status Sync)',
    description:
      'Receives and verifies real-time parcel delivery status updates from Pathao. Validates HMAC signature, checks 7-day sliding window idempotency, and monotonically advances order status (SHIPPED, DELIVERED, RETURNED).',
  })
  @ApiResponse({ status: 200, description: 'Webhook ingested and state synchronized successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing Pathao webhook signature' })
  async handlePathaoWebhook(@Body() dto: PathaoWebhookDto) {
    return this.pathaoService.handleInboundWebhook(dto);
  }

  @Get('courier/pathao/tracking/:consignmentId')
  @ApiOperation({
    summary: 'Query live Pathao consignment delivery status',
    description: 'Fetches real-time rider tracking, delivery milestone, and dispatch status by consignment ID.',
  })
  @ApiParam({ name: 'consignmentId', description: 'Pathao Consignment ID', example: 'DB1029384' })
  @ApiResponse({ status: 200, description: 'Tracking status returned successfully' })
  async getTrackingStatus(@Param('consignmentId') consignmentId: string) {
    return this.pathaoService.getTrackingStatus(consignmentId);
  }

  @Get('admin/courier/pathao/dlq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Inspect failed courier dispatch Dead-Letter Queue (DLQ)',
    description: 'Lists courier booking payloads that exhausted exponential retry attempts for staff remediation.',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max DLQ entries to return (default: 50)' })
  @ApiResponse({ status: 200, description: 'Dead-letter queue entries returned' })
  async getDlqEntries(@Query('limit') limit?: number) {
    return this.pathaoService.getDlqEntries(limit ? Number(limit) : 50);
  }

  // ==========================================
  // DYNAMIC MULTI-COURIER ROUTER (PATHAO 1ST, STEADFAST BACKUP)
  // ==========================================

  @Post('courier/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Smart Order Dispatch: Pathao as first choice with Steadfast automated backup',
    description:
      'Dynamically routes order dispatch. Attempts booking with Pathao first. If Pathao fails (API outage, unserviceable zone), automatically fails over to Steadfast and logs audit trail.',
  })
  @ApiResponse({ status: 200, description: 'Order successfully dispatched through optimal courier' })
  @ApiResponse({ status: 400, description: 'Dispatch failed across all configured courier partners' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async smartDispatch(
    @Body() dto: SmartDispatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.courierRoutingService.dispatchOrder(dto, user?.userId);
  }

  @Get('courier/routing/policy')
  @ApiOperation({
    summary: 'Get multi-courier routing policy hierarchy',
    description: 'Returns carrier hierarchy: Pathao as primary choice and Steadfast as failover backup.',
  })
  @ApiResponse({ status: 200, description: 'Active routing policy configuration' })
  getRoutingPolicy() {
    return this.courierRoutingService.getRoutingPolicy();
  }
}
