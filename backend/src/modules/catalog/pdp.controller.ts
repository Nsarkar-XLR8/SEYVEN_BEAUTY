import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PdpService } from './services/pdp.service';
import { WaitlistService } from './services/waitlist.service';
import { CreateWaitlistSubscriptionDto } from './dto/waitlist.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products / PDP')
@Controller('products')
export class PdpController {
  constructor(
    private readonly pdpService: PdpService,
    private readonly waitlistService: WaitlistService,
  ) {}

  @Get(':slug/pdp')
  @ApiOperation({
    summary: 'High-speed composite Product Detail Page (PDP) payload',
    description: 'Bundles variant stock matrix, INCI breakdown, dermal protocol FAQs, delivery estimators, and Schema.org JSON-LD.',
  })
  @ApiParam({ name: 'slug', description: 'Product unique URL slug' })
  @ApiQuery({ name: 'previewToken', required: false, description: 'HMAC preview token for draft products' })
  @ApiResponse({ status: 200, description: 'Comprehensive PDP payload' })
  @ApiResponse({ status: 404, description: 'Product not found or unpublished' })
  getProductDetailPage(
    @Param('slug') slug: string,
    @Query('previewToken') previewToken?: string,
  ) {
    return this.pdpService.getProductDetailPage(slug, previewToken);
  }

  @Post(':id/waitlist')
  @ApiOperation({
    summary: 'Subscribe customer to restock SMS/email notification ("Notify when back in stock")',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 201, description: 'Subscribed to waitlist restock alerts' })
  @ApiResponse({ status: 400, description: 'Invalid Bangladeshi phone number' })
  @ApiResponse({ status: 404, description: 'Product or variant not found' })
  subscribeToWaitlist(
    @Param('id') id: string,
    @Body() dto: CreateWaitlistSubscriptionDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.waitlistService.subscribe(id, dto, user?.userId);
  }
}
