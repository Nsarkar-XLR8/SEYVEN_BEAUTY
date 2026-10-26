import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { CreateBkashPaymentDto, BkashCallbackDto } from './dto/bkash.dto';
import { InitSSLCommerzPaymentDto, SSLCommerzIpnDto } from './dto/sslcommerz.dto';
import { ProcessRefundDto } from './dto/refund.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments & Split Ledger')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Initiate online payment session (bKash, SSLCommerz, etc.)',
    description: 'Generates gateway checkout URL for advance delivery fee or full prepayment.',
  })
  @ApiResponse({ status: 200, description: 'Payment session successfully initiated' })
  async initiatePayment(@Body() dto: InitiatePaymentDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.paymentsService.initiatePayment(dto, userId);
  }

  @Post('bkash/create')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Create bKash Tokenized Payment session',
    description: 'Initializes direct bKash checkout and returns paymentID and checkout URL.',
  })
  @ApiResponse({ status: 200, description: 'bKash payment created' })
  async createBkashPayment(@Body() dto: CreateBkashPaymentDto) {
    return this.paymentsService.createBkashPayment(dto);
  }

  @Post('bkash/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute bKash payment on customer callback',
    description: 'Called after customer completes PIN verification on bKash URL.',
  })
  @ApiResponse({ status: 200, description: 'bKash payment executed' })
  async handleBkashCallback(@Body() dto: BkashCallbackDto) {
    return this.paymentsService.handleBkashCallback(dto);
  }

  @Post('sslcommerz/init')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Initialize SSLCommerz Payment Gateway Session',
    description: 'Generates hosted payment gateway URL for credit cards, debit cards, and MFS.',
  })
  @ApiResponse({ status: 200, description: 'SSLCommerz session initialized' })
  async initSSLCommerzPayment(@Body() dto: InitSSLCommerzPaymentDto) {
    return this.paymentsService.initSSLCommerzPayment(dto);
  }

  @Post('sslcommerz/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'SSLCommerz Server-to-Server IPN Webhook',
    description: 'Verifies IPN callback, prevents replay attacks, updates split ledger and order status.',
  })
  @ApiResponse({ status: 200, description: 'IPN validated and processed' })
  async handleSSLCommerzIpn(@Body() ipnDto: SSLCommerzIpnDto) {
    return this.paymentsService.handleSSLCommerzIpn(ipnDto);
  }

  @Post('verify/:trxId')
  @ApiOperation({
    summary: 'Query payment status by TrxID or Gateway ID',
    description: 'Queries database and upstream gateway status.',
  })
  @ApiResponse({ status: 200, description: 'Transaction verification status' })
  async verifyTransaction(@Param('trxId') trxId: string) {
    return this.paymentsService.verifyTransaction(trxId);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_OFFICER, UserRole.SUPPORT_AGENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process full or partial refund',
    description: 'Disburses refund via gateway and logs ledger debit.',
  })
  @ApiResponse({ status: 200, description: 'Refund successfully processed' })
  async processRefund(@Body() dto: ProcessRefundDto) {
    return this.paymentsService.processRefund(dto);
  }

  @Get(':id/ledger')
  @ApiOperation({
    summary: 'Get split payment ledger and balance breakdown',
    description: 'Fetches advance fee paid, COD due, and all running ledger entries for an order.',
  })
  @ApiResponse({ status: 200, description: 'Split ledger breakdown' })
  async getLedger(@Param('id') orderId: string) {
    return this.paymentsService.getLedger(orderId);
  }
}
