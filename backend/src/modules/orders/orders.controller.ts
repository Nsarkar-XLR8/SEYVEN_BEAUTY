import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './services/orders.service';
import { DispatchDocsService } from './services/dispatch-docs.service';
import { RtoReturnsService } from './services/rto-returns.service';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { LogCallVerificationDto } from './dto/log-call-verification.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ExportManifestDto, ManifestExportFormat } from './dto/export-manifest.dto';
import { PartialDeliveryDto } from './dto/partial-delivery.dto';
import { RecordRtoExpenseDto } from './dto/record-rto-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Order Lifecycle State Machine & Operations Desk')
@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly dispatchDocsService: DispatchDocsService,
    private readonly rtoReturnsService: RtoReturnsService,
  ) {}

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List customer or operations desk orders with filters & pagination',
    description:
      'Retrieves order list with real-time status, items summary, and call verification status. Scoped to authenticated customer for CUSTOMER role; accessible across all orders with query filters for operations staff.',
  })
  @ApiResponse({ status: 200, description: 'Paginated order list returned successfully' })
  async listOrders(
    @Query() query: ListOrdersQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.listOrders(query, user);
  }

  @Get('orders/check-returning-client')
  @ApiOperation({
    summary: 'Check returning client eligibility by phone number and/or email',
    description: 'Systematically checks phone number first, and email as verification. Returns past order match & courtesy privilege without login.',
  })
  async checkReturningClient(
    @Query('phone') phone?: string,
    @Query('email') email?: string,
  ) {
    return this.ordersService.checkReturningClient(phone, email);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Retrieve detailed order record with complete timeline & next allowed transitions',
    description:
      'Fetches complete order detail including line items, shipping address, split ledger, full immutable audit trail, COD call verification attempts, and allowed forward status transitions.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order details and audit timeline returned' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Customer access denied to other users orders' })
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.getOrderById(id, user);
  }

  @Delete('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Permanently delete an order and associated records (Admin Desk)',
    description: 'Permanently removes an order and cascading relations from PostgreSQL database.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID or Order Number' })
  @ApiResponse({ status: 200, description: 'Order permanently deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.deleteOrder(id, user);
  }

  @Post('orders/direct')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Direct customer order placement from storefront checkout' })
  @ApiResponse({ status: 201, description: 'Customer order placed and synced to admin desk' })
  async createDirectOrder(@Body() body: any) {
    return this.ordersService.createDirectOrder(body);
  }

  @Get('orders/direct-test-alert')
  @ApiOperation({ summary: 'Diagnostic test probe for order notification queue and DLQ' })
  async testDirectAlert() {
    const testOrder = {
      orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'SEYVEN Production Test',
      customerPhone: '+8801999181198',
      customerEmail: 'officialseyven@gmail.com',
      shippingAddress: 'Dhanmondi, Dhaka',
      district: 'Inside Dhaka',
      zone: 'Dhaka Metro',
      items: [
        {
          id: 'test-item-1',
          title: 'Advanced Dermal Curation Test',
          titleEn: 'Advanced Dermal Curation Test',
          quantity: 1,
          unitPrice: 1500,
          totalPrice: 1500,
        },
      ],
      subtotal: 1500,
      deliveryFee: 70,
      discount: 0,
      totalAmount: 1570,
      paymentMethod: 'COD',
      source: 'DIAGNOSTIC_PROBE',
      status: 'TEST',
      createdAt: new Date().toISOString(),
    };
    return this.ordersService.createDirectOrder(testOrder);
  }

  @Post('admin/orders/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assisted manual order creation (Social Commerce / Phone Desk)',
    description:
      'Enables support and catalog staff to book orders on behalf of consumers from Facebook Messenger, WhatsApp, or phone inquiries. Computes pricing, delivery zones, VAT, and records staff audit trail.',
  })
  @ApiResponse({ status: 201, description: 'Manual assisted order created in CONFIRMED status' })
  @ApiResponse({ status: 400, description: 'Validation failed or missing product variants' })
  async createManualOrder(
    @Body() dto: CreateManualOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.createManualOrder(dto, user?.userId);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.FULFILLMENT_OPERATOR,
    UserRole.FINANCE_OFFICER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update order lifecycle status with monotonic forward transition guard',
    description:
      'Transitions order to next status in lifecycle. Strict monotonic guard rejects out-of-order webhook regression and terminal state mutations. Records immutable staff audit entry and dispatches outbox event.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order status transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Illegal or backward status transition attempt' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.updateOrderStatus(id, dto, user?.userId);
  }

  @Post('admin/orders/:id/call-verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log COD Phone Call Verification outcome and auto-transition status',
    description:
      'Logs customer verification attempt (CONFIRMED, NO_ANSWER, CANCELLED, BUSY, RESCHEDULED). Automatically shifts PLACED orders to CONFIRMED on confirmation, or to CANCELLED on cancellation request.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Call verification recorded and status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async logCallVerification(
    @Param('id') id: string,
    @Body() dto: LogCallVerificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.logCallVerification(id, dto, user?.userId);
  }

  // ==========================================
  // DISPATCH, TAX & MANIFEST APIS (PHASE 20)
  // ==========================================

  @Get('admin/orders/:id/label')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate 4x6 inch thermal shipping label Vector PDF',
    description:
      'Renders standard 4x6 inch (288x432 pt) vector thermal shipping label with prominent COD vs Prepaid badges, simulated vector Code128 barcodes, recipient address block, and luxury cosmetic handling advisory.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Vector PDF binary stream for thermal label printer' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getShippingLabel(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.dispatchDocsService.generateShippingLabelPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="shipping-label-${id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    return res.end(pdfBuffer);
  }

  @Get('admin/orders/:id/mushak-6.3')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FULFILLMENT_OPERATOR,
    UserRole.FINANCE_OFFICER,
    UserRole.SUPPORT_AGENT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate NBR Mushak-6.3 VAT Tax Invoice Vector PDF',
    description:
      'Generates statutory NBR Mushak-6.3 VAT tax invoice in A4 format pursuant to Rule 40 of Bangladesh VAT & SD Rules 2016, with SEYVEN registered BIN, fiscal serial number, itemized rates (5% VAT), and statutory declaration.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'NBR Mushak-6.3 VAT Tax Invoice PDF binary stream' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getMushak63Invoice(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.dispatchDocsService.generateMushak63Pdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="mushak-6.3-${id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    return res.end(pdfBuffer);
  }

  @Get('admin/manifests/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Export 1-Click Bulk Courier Dispatch Manifest (PDF or CSV)',
    description:
      'Aggregates dispatched courier parcels for warehouse pickup handover (Pathao / Steadfast). Outputs summary metrics (total parcels, COD sum) and handover rider sign-off blocks in vector PDF or RFC-4180 CSV.',
  })
  @ApiResponse({ status: 200, description: 'Courier handover manifest export' })
  async exportManifest(
    @Query() query: ExportManifestDto,
    @Res() res: Response,
  ) {
    if (query.format === ManifestExportFormat.CSV) {
      const csvContent = await this.dispatchDocsService.generateManifestCsv(query);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="courier-manifest-${Date.now()}.csv"`,
      });
      return res.send(csvContent);
    }

    const pdfBuffer = await this.dispatchDocsService.generateManifestPdf(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="courier-manifest-${Date.now()}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    return res.end(pdfBuffer);
  }

  @Get('admin/orders/:id/packing-slip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate Warehouse Itemized Picking & Packing Slip Vector PDF',
    description:
      'Creates warehouse operator checklist containing item SKUs, rack bin locations, pick quantities, mandatory FEFO expiry check (minimum 90-day remaining shelf life), and quality assurance packaging sign-off lines.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Warehouse picking & packing slip PDF stream' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPackingSlip(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.dispatchDocsService.generatePackingSlipPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="packing-slip-${id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    return res.end(pdfBuffer);
  }

  // ==========================================
  // PARTIAL DELIVERY, RTO & MUSHAK-6.7 (PHASE 21)
  // ==========================================

  @Post('admin/orders/:id/partial-delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust order for doorstep partial item acceptance',
    description:
      'Adjusts order line items and pricing for items accepted by customer at doorstep. Automatically releases rejected items back into active inventory lots, updates payment status, and generates NBR Mushak-6.7 Credit Note.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order adjusted for partial acceptance and credit note issued' })
  @ApiResponse({ status: 400, description: 'Invalid accepted quantity or order state' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processPartialDelivery(
    @Param('id') id: string,
    @Body() dto: PartialDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.rtoReturnsService.processPartialDelivery(id, dto, user?.userId);
  }

  @Post('admin/orders/:id/rto')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FULFILLMENT_OPERATOR, UserRole.FINANCE_OFFICER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record courier Return-to-Origin (RTO) expense and restock inventory',
    description:
      'Logs courier delivery failure in rto_expenses table recording unrecoverable forward and return shipping fees. Automatically releases all units back into active inventory lots, shifts order to RETURNED, and issues NBR Mushak-6.7 Credit Note.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'RTO expense recorded, items restocked, and credit note issued' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processRto(
    @Param('id') id: string,
    @Body() dto: RecordRtoExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.rtoReturnsService.processRto(id, dto, user?.userId);
  }

  @Get('admin/orders/:id/mushak-6.7')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FULFILLMENT_OPERATOR,
    UserRole.FINANCE_OFFICER,
    UserRole.SUPPORT_AGENT,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate NBR Mushak-6.7 Credit Note Vector PDF',
    description:
      'Renders statutory NBR Form Mushak-6.7 Credit Note (কর ক্রেডিট নোট) in Vector PDF A4 format pursuant to Rule 40(1)(g) of Bangladesh VAT & SD Rules 2016 for returned, rejected, or adjusted orders.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'NBR Mushak-6.7 Credit Note PDF stream' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getMushak67CreditNote(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.rtoReturnsService.generateMushak67Pdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="mushak-6.7-${id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    return res.end(pdfBuffer);
  }
}


