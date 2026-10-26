import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({
    description: 'Coupon promo code',
    example: 'WELCOME10',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Current active cart subtotal in BDT',
    example: 3500,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    description: 'Guest token if client is unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;

  @ApiPropertyOptional({
    description: 'Whether client is currently claiming a loyalty tier percentage discount',
    default: false,
    example: false,
  })
  @IsOptional()
  hasTierDiscount?: boolean = false;
}

export class ApplyCouponDto {
  @ApiProperty({
    description: 'Coupon promo code to attach to active shopping cart',
    example: 'WELCOME10',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'Guest token if client is unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;
}

export class DetachCouponDto {
  @ApiPropertyOptional({
    description: 'Guest token if client is unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;
}
