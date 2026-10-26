import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum PaymentGatewayOption {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
  SHURJOPAY = 'SHURJOPAY',
}

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Full recipient name',
    example: 'Ayesha Rahman',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Bangladeshi contact phone number (E.164 or local 01XXXXXXXXX)',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    description: 'Administrative Division of Bangladesh',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiProperty({
    description: 'District name',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({
    description: 'Thana / Upazila / Local delivery area',
    example: 'Dhanmondi',
  })
  @IsOptional()
  @IsString()
  thanaArea?: string;

  @ApiPropertyOptional({
    description: 'Courier Zone ID (1: Inside Dhaka, 2: Dhaka Suburbs, 3: Outside Dhaka Major, 4: Remote Upazila)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  courierZoneId?: number = 1;

  @ApiProperty({
    description: 'Street address with house/road/flat details',
    example: 'House 42, Road 7A, Dhanmondi R/A',
  })
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiPropertyOptional({
    description: 'Nearby landmark for courier delivery orientation',
    example: 'Near Dhanmondi Lake Bridge',
  })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class CalculateCheckoutDto {
  @ApiProperty({
    description: 'Recipient shipping destination',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description: 'Optional promotional coupon voucher code',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Guest session token if unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;

  @ApiPropertyOptional({
    description: 'Selected payment gateway',
    enum: PaymentGatewayOption,
    default: PaymentGatewayOption.COD,
    example: PaymentGatewayOption.COD,
  })
  @IsOptional()
  @IsEnum(PaymentGatewayOption)
  paymentGateway?: PaymentGatewayOption = PaymentGatewayOption.COD;
}

export class CommitCheckoutDto {
  @ApiProperty({
    description: 'Recipient shipping destination',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Selected payment method',
    enum: PaymentGatewayOption,
    default: PaymentGatewayOption.COD,
    example: PaymentGatewayOption.COD,
  })
  @IsEnum(PaymentGatewayOption)
  paymentGateway: PaymentGatewayOption = PaymentGatewayOption.COD;

  @ApiPropertyOptional({
    description: 'Optional promo voucher code',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Guest token if client is unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;

  @ApiPropertyOptional({
    description: 'Confirmation of e-commerce Terms of Service acceptance',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean = true;

  @ApiPropertyOptional({
    description: 'Digital consent for order processing and data handling',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  privacyConsentAccepted?: boolean = true;

  @ApiPropertyOptional({
    description: 'Special courier delivery instructions',
    example: 'Please call before delivery. Deliver between 2 PM and 6 PM.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

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

  @ApiPropertyOptional({ description: 'UTM Term', example: 'dermal_elixir' })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @ApiPropertyOptional({ description: 'UTM Content', example: 'carousel_v1' })
  @IsOptional()
  @IsString()
  utmContent?: string;

  @ApiPropertyOptional({ description: 'First touch UTM parameters payload' })
  @IsOptional()
  firstTouchUtm?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Last touch UTM parameters payload' })
  @IsOptional()
  lastTouchUtm?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Facebook Click ID', example: 'fbclid_12345' })
  @IsOptional()
  @IsString()
  fbclid?: string;

  @ApiPropertyOptional({ description: 'Google Click ID', example: 'gclid_12345' })
  @IsOptional()
  @IsString()
  gclid?: string;

  @ApiPropertyOptional({ description: 'Meta event ID for browser-server deduplication', example: 'evt_12345' })
  @IsOptional()
  @IsString()
  metaEventId?: string;
}
