import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UserDataDto {
  @ApiPropertyOptional({ description: 'Contact phone number (will be SHA-256 hashed)', example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address (will be SHA-256 hashed)', example: 'ayesha@seyven.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer first name (will be SHA-256 hashed)', example: 'Ayesha' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Customer last name (will be SHA-256 hashed)', example: 'Rahman' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'City/District name (will be SHA-256 hashed)', example: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Administrative Division (will be SHA-256 hashed)', example: 'Dhaka' })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional({ description: 'Client IP address (IPv4 / IPv6)', example: '103.145.120.4' })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiPropertyOptional({ description: 'Client User Agent string', example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Meta browser cookie _fbp value', example: 'fb.1.1689234567890.123456789' })
  @IsOptional()
  @IsString()
  fbp?: string;

  @ApiPropertyOptional({ description: 'Meta ad click cookie _fbc value', example: 'fb.1.1689234567890.IwAR234567890' })
  @IsOptional()
  @IsString()
  fbc?: string;
}

export class ContentItemDto {
  @ApiProperty({ description: 'Product SKU or Variant ID', example: 'SYV-RET-01' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Item quantity', example: 1 })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit price in BDT', example: 1850 })
  @IsOptional()
  @IsNumber()
  itemPrice?: number;

  @ApiPropertyOptional({ description: 'Product Title', example: '0.2% Pure Retinol Night Elixir' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Product Category', example: 'Serums' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CustomDataDto {
  @ApiPropertyOptional({ description: 'Monetary value of event in BDT', example: 1850 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ description: 'Currency ISO-4217 code', default: 'BDT', example: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string = 'BDT';

  @ApiPropertyOptional({ description: 'Order ID or Order Number if applicable', example: 'SYV-202610-A9F1B2' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'List of product SKU or IDs', example: ['SYV-RET-01'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentIds?: string[];

  @ApiPropertyOptional({ description: 'Detailed items list', type: [ContentItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  contents?: ContentItemDto[];

  @ApiPropertyOptional({ description: 'Content type', default: 'product', example: 'product' })
  @IsOptional()
  @IsString()
  contentType?: 'product' | 'product_group' = 'product';

  @ApiPropertyOptional({ description: 'Number of unique or total items', example: 1 })
  @IsOptional()
  @IsInt()
  numItems?: number;

  @ApiPropertyOptional({ description: 'Coupon code if used', example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  coupon?: string;
}

export class UtmParamsDto {
  @ApiPropertyOptional({ description: 'UTM Source', example: 'facebook' })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiPropertyOptional({ description: 'UTM Medium', example: 'cpc' })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiPropertyOptional({ description: 'UTM Campaign', example: 'retinol_launch_q4' })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({ description: 'UTM Term / Keywords', example: 'anti_aging_serum' })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'UTM Content / Creative variant', example: 'video_dermatologist_review' })
  @IsOptional()
  @IsString()
  utmContent?: string;

  @ApiPropertyOptional({ description: 'Facebook Click ID', example: 'fbclid_9876543210' })
  @IsOptional()
  @IsString()
  fbclid?: string;

  @ApiPropertyOptional({ description: 'Google Click ID', example: 'gclid_1234567890' })
  @IsOptional()
  @IsString()
  gclid?: string;
}

export class IngestAnalyticsEventDto {
  @ApiProperty({
    description: 'Standard marketing event name (e.g. Purchase, AddToCart, InitiateCheckout, ViewContent, PageView)',
    example: 'Purchase',
  })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiPropertyOptional({
    description: 'Shared event ID for browser-server deduplication. Generated automatically if omitted.',
    example: 'evt_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Unix timestamp of event in seconds',
    example: 1760611200,
  })
  @IsOptional()
  @IsInt()
  eventTime?: number;

  @ApiPropertyOptional({
    description: 'URL where event occurred on website',
    example: 'https://seyven.com/checkout/success',
  })
  @IsOptional()
  @IsString()
  eventSourceUrl?: string;

  @ApiPropertyOptional({
    description: 'Action source for Meta CAPI',
    default: 'website',
    example: 'website',
  })
  @IsOptional()
  @IsString()
  actionSource?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other' = 'website';

  @ApiPropertyOptional({
    description: 'Customer identifying data (email, phone, ip, userAgent, fbp, fbc)',
    type: UserDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDataDto)
  userData?: UserDataDto;

  @ApiPropertyOptional({
    description: 'Event monetary and product payload',
    type: CustomDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomDataDto)
  customData?: CustomDataDto;

  @ApiPropertyOptional({
    description: 'First touch attribution UTM parameters',
    type: UtmParamsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmParamsDto)
  firstTouchUtm?: UtmParamsDto;

  @ApiPropertyOptional({
    description: 'Last touch attribution UTM parameters',
    type: UtmParamsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmParamsDto)
  lastTouchUtm?: UtmParamsDto;

  @ApiPropertyOptional({
    description: 'Guest session token for unauthenticated visitors',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;

  @ApiPropertyOptional({
    description: 'Google Analytics 4 Client ID (e.g. from _ga cookie)',
    example: '123456789.987654321',
  })
  @IsOptional()
  @IsString()
  clientId?: string;
}
