import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
// Generated Prisma Enums for Order Channel and Payment Gateways
import { OrderSource, PaymentGateway } from '@prisma/client';

export class ManualOrderItemDto {
  @ApiProperty({ description: 'Product SKU Variant UUID', example: 'd3b07384-d113-46fb-9c8e-a9b3112b07e6' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ description: 'Quantity ordered', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Custom agreed price in BDT (overrides default variant price if provided)', example: 1450 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPriceBdt?: number;
}

export class ManualShippingAddressDto {
  @ApiProperty({ description: 'Recipient full name', example: 'Ayesha Rahman' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Recipient mobile phone number', example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'Bangladesh Division', example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  division!: string;

  @ApiProperty({ description: 'Bangladesh District', example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  district!: string;

  @ApiProperty({ description: 'Thana or Upazila area', example: 'Gulshan-2' })
  @IsString()
  @IsNotEmpty()
  thanaArea!: string;

  @ApiPropertyOptional({ description: 'Steadfast/Courier Zone ID', example: 1 })
  @IsOptional()
  @IsNumber()
  courierZoneId?: number;

  @ApiProperty({ description: 'Complete street address with house and road number', example: 'House 14, Road 113, Gulshan-2, Dhaka 1212' })
  @IsString()
  @IsNotEmpty()
  streetAddress!: string;

  @ApiPropertyOptional({ description: 'Prominent nearby landmark', example: 'Near Gulshan Lake Park' })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class CreateManualOrderDto {
  @ApiProperty({ description: 'Customer contact phone number', example: '01712345678' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ description: 'Customer full name', example: 'Ayesha Rahman' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiPropertyOptional({ description: 'Associated registered customer user ID if known', example: 'c56a4180-65aa-42ec-a945-5fd21dec0538' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    enum: OrderSource,
    description: 'Channel source for assisted sale',
    example: OrderSource.MESSENGER,
  })
  @IsEnum(OrderSource)
  source!: OrderSource;

  @ApiPropertyOptional({ description: 'External chat ID or thread reference (e.g. Messenger PSID or WhatsApp number)', example: 'fb_psid_9981245' })
  @IsOptional()
  @IsString()
  channelReference?: string;

  @ApiProperty({ type: ManualShippingAddressDto, description: 'Destination shipping address' })
  @ValidateNested()
  @Type(() => ManualShippingAddressDto)
  shippingAddress!: ManualShippingAddressDto;

  @ApiProperty({ type: [ManualOrderItemDto], description: 'List of ordered SKU items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualOrderItemDto)
  items!: ManualOrderItemDto[];

  @ApiPropertyOptional({ description: 'Custom delivery fee in BDT. If omitted, calculated from shipping zone.', example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFeeBdt?: number;

  @ApiPropertyOptional({ description: 'Manual discount deduction in BDT', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountBdt?: number;

  @ApiPropertyOptional({ description: 'Advance payment already collected from customer in BDT (e.g. bKash Send Money)', example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advancePaidBdt?: number;

  @ApiPropertyOptional({
    enum: PaymentGateway,
    description: 'Primary payment method',
    default: PaymentGateway.COD,
    example: PaymentGateway.COD,
  })
  @IsOptional()
  @IsEnum(PaymentGateway)
  paymentGateway?: PaymentGateway = PaymentGateway.COD;

  @ApiPropertyOptional({ description: 'Internal staff notes from phone/chat consultation', example: 'Customer requested evening delivery after 6 PM' })
  @IsOptional()
  @IsString()
  staffNotes?: string;
}
