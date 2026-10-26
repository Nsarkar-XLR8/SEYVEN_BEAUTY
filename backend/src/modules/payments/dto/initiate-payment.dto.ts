import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentGateway, PaymentType } from '../interfaces/payment.interface';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Order UUID for which payment is being made',
    example: 'd3b07384-d113-4a0e-bc21-7e3e23075678',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    enum: PaymentGateway,
    description: 'Payment gateway or MFS provider',
    example: PaymentGateway.BKASH,
  })
  @IsEnum(PaymentGateway)
  @IsNotEmpty()
  gateway: PaymentGateway;

  @ApiPropertyOptional({
    enum: PaymentType,
    description: 'Type of payment (advance delivery fee, full prepayment, partial payment)',
    default: PaymentType.FULL_PREPAYMENT,
    example: PaymentType.ADVANCE_DELIVERY_FEE,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType = PaymentType.FULL_PREPAYMENT;

  @ApiPropertyOptional({
    description: 'Custom amount to pay (must not exceed payable due)',
    example: 150,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amountBdt?: number;

  @ApiPropertyOptional({
    description: 'Success redirect URL for browser checkout flow',
  })
  @IsString()
  @IsOptional()
  redirectSuccessUrl?: string;

  @ApiPropertyOptional({
    description: 'Failure or cancel redirect URL for browser checkout flow',
  })
  @IsString()
  @IsOptional()
  redirectFailUrl?: string;
}
