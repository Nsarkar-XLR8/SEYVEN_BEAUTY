import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RmaService } from './rma.service';
import { CreateRmaRequestDto } from './dto/create-rma.dto';
import { InspectRmaDto } from './dto/inspect-rma.dto';
import { SettleRmaDto } from './dto/settle-rma.dto';
import { QueryRmaDto } from './dto/query-rma.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Returns & Refunds (RMA) & Cosmetic Hygiene Guard')
@Controller()
export class RmaController {
  constructor(private readonly rmaService: RmaService) {}

  @Post('rma/requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit customer return & refund request (RMA)',
    description:
      'Submits a formal return request with mandatory photographic/video evidence. Enforces the 7-day post-delivery statutory return window and starts the 7-day Bangladesh Digital Commerce regulatory refund countdown timer.',
  })
  @ApiResponse({ status: 201, description: 'RMA created with ticket number and deadline tracking' })
  @ApiResponse({ status: 400, description: 'Invalid payload, outside return window, or missing evidence' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createRmaRequest(
    @Body() dto: CreateRmaRequestDto,
    @Req() req: Request,
  ) {
    const authUser = (req as any).user;
    return this.rmaService.submitRmaRequest(
      dto,
      authUser?.id,
      authUser?.role,
    );
  }

  @Get('rma/requests/:id')
  @ApiOperation({
    summary: 'Track RMA request progress & regulatory refund deadline',
    description:
      'Retrieves full RMA status, itemized items, hygiene inspection outcome, and real-time SLA countdown to the statutory refund deadline.',
  })
  @ApiParam({ name: 'id', description: 'RMA UUID or RMA Number (RMA-YYYYMM-XXXX)' })
  @ApiResponse({ status: 200, description: 'RMA details and SLA status returned' })
  @ApiResponse({ status: 404, description: 'RMA not found' })
  async getRmaProgress(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const authUser = (req as any).user;
    return this.rmaService.getRmaProgress(
      id,
      authUser?.id,
      authUser?.role,
    );
  }

  @Patch('admin/rma/:id/inspect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.FULFILLMENT_OPERATOR,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Record cosmetic hygiene inspection outcome (Staff Desk)',
    description:
      'Records warehouse physical inspection results. Under DGDA and cosmetic hygiene regulations, skincare products with compromised seals are strictly rejected for change-of-mind claims to prevent microbial cross-contamination.',
  })
  @ApiParam({ name: 'id', description: 'RMA UUID' })
  @ApiResponse({ status: 200, description: 'Inspection recorded and RMA updated' })
  @ApiResponse({ status: 404, description: 'RMA not found' })
  async inspectRma(
    @Param('id') id: string,
    @Body() dto: InspectRmaDto,
    @Req() req: Request,
  ) {
    const staffUserId = (req as any).user?.id;
    return this.rmaService.inspectRma(id, dto, staffUserId);
  }

  @Post('admin/rma/:id/settle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_OFFICER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disburse refund & issue statutory NBR Mushak-6.7 Credit Note',
    description:
      'Executes customer refund disbursement to original MFS wallet (bKash/Nagad/SSLCommerz) or store credit. Automatically generates an immutable NBR Form Mushak-6.7 Credit Note for fiscal VAT reconciliation.',
  })
  @ApiParam({ name: 'id', description: 'RMA UUID' })
  @ApiResponse({ status: 200, description: 'Refund disbursed and Mushak-6.7 issued' })
  @ApiResponse({ status: 400, description: 'RMA already settled or rejected' })
  async settleRma(
    @Param('id') id: string,
    @Body() dto: SettleRmaDto,
    @Req() req: Request,
  ) {
    const staffUserId = (req as any).user?.id;
    return this.rmaService.settleRma(id, dto, staffUserId);
  }

  @Get('admin/rma')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.FULFILLMENT_OPERATOR,
    UserRole.FINANCE_OFFICER,
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List RMA requests with filters & pagination (Operations Desk)',
    description: 'Lists all return requests with status, customer phone, and order number filters.',
  })
  @ApiResponse({ status: 200, description: 'Paginated RMA list returned' })
  async listRmaRequests(@Query() query: QueryRmaDto) {
    return this.rmaService.listRmaRequests(query);
  }
}
