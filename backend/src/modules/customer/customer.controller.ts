import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerService } from './customer.service';
import { GdprDeleteAccountDto } from './dto/gdpr-delete.dto';
import { ManageAddressesDto } from './dto/manage-addresses.dto';
import { QuickTrackQueryDto } from './dto/quick-track.dto';

@ApiTags('Customer 360, Self-Serve Portal & Data Privacy')
@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('tracking/quick-track')
  @ApiOperation({
    summary: 'Public instant order tracking by orderNumber & phone',
    description:
      'Allows guests and registered customers to look up order progress, courier status, and live milestone events using their order number and phone without logging in. Returns masked personal data for privacy.',
  })
  @ApiResponse({ status: 200, description: 'Order tracking details and live courier status' })
  @ApiResponse({ status: 400, description: 'Invalid Bangladeshi phone number or query' })
  @ApiResponse({ status: 404, description: 'Order not found matching order number and phone' })
  async quickTrack(@Query() query: QuickTrackQueryDto) {
    return this.customerService.quickTrack(query);
  }

  @Get('customer/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get authenticated customer profile & dermal history',
    description:
      'Returns the authenticated customer profile, saved multi-address book, skin diagnostic profile, loyalty points balance, active orders, and active RMA tickets.',
  })
  @ApiResponse({ status: 200, description: 'Customer profile details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const authUser = (req as any).user;
    return this.customerService.getProfile(authUser?.id || authUser?.userId);
  }

  @Put('customer/addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manage customer multi-address book',
    description:
      'Creates, edits, or replaces the customer saved shipping addresses. Automatically maps CourierZoneId (Dhaka Metro, Suburbs, Outside Dhaka) based on district and thana if omitted.',
  })
  @ApiResponse({ status: 200, description: 'Saved addresses successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async manageAddresses(
    @Req() req: Request,
    @Body() dto: ManageAddressesDto,
  ) {
    const authUser = (req as any).user;
    return this.customerService.manageAddresses(authUser?.id || authUser?.userId, dto);
  }

  @Get('admin/customer-360/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.FINANCE_OFFICER,
    UserRole.CATALOG_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Customer 360 intelligence dossier (Staff/Admin)',
    description:
      'Aggregates high-value operational telemetry for customer service and fraud detection: LTV, AOV, delivery success rate, RTO loss tally, fraud risk score, BTRC SMS logs, WhatsApp receipts, and IVR call verifications.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: '360 customer dossier generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomer360(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getCustomer360(id);
  }

  @Post('customer/gdpr/export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export personal data archive (Digital Security Act / GDPR)',
    description:
      'Generates a comprehensive machine-readable JSON archive containing all personal data, orders, dermal diagnostic profiles, reviews, grievances, and notification logs for the requesting customer.',
  })
  @ApiResponse({ status: 200, description: 'Machine-readable personal data archive' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportPersonalData(@Req() req: Request) {
    const authUser = (req as any).user;
    return this.customerService.exportPersonalData(authUser.id);
  }

  @Post('customer/gdpr/delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Right-to-Erasure account deletion (Digital Security Act / GDPR)',
    description:
      'Permanently redacts customer personal data (phone, email, name, addresses, skin diagnostic history) while preserving Mushak-6.3 fiscal tax invoice records in accordance with Bangladesh statutory financial compliance.',
  })
  @ApiResponse({ status: 200, description: 'Customer account successfully anonymized' })
  @ApiResponse({ status: 400, description: 'Confirmation passphrase does not match DELETE_MY_ACCOUNT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async executeRightToErasure(
    @Req() req: Request,
    @Body() dto: GdprDeleteAccountDto,
  ) {
    const authUser = (req as any).user;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Customer Portal';

    return this.customerService.executeRightToErasure(
      authUser.id,
      dto,
      ipAddress,
      userAgent,
    );
  }
}
