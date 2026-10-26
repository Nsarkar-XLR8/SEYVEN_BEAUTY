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
import { PaymentType } from '../interfaces/payment.interface';

export class CreateBkashPaymentDto {
  @ApiProperty({
    description: 'Order UUID to initialize bKash payment for',
    example: 'd3b07384-d113-4a0e-bc21-7e3e23075678',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    enum: PaymentType,
    description: 'Type of bKash payment: advance delivery fee or full prepayment',
    default: PaymentType.FULL_PREPAYMENT,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType = PaymentType.FULL_PREPAYMENT;

  @ApiPropertyOptional({
    description: 'Custom amount to pay if split/partial',
    example: 120,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amountBdt?: number;

  @ApiPropertyOptional({
    description: 'Custom client return callback URL after bKash payment',
  })
  @IsString()
  @IsOptional()
  callbackUrl?: string;
}

export class BkashCallbackDto {
  @ApiProperty({
    description: 'bKash internal paymentID',
    example: 'TR0011XXYYZZ',
  })
  @IsString()
  @IsNotEmpty()
  paymentID: string;

  @ApiProperty({
    description: 'Payment status returned from bKash callback (success, cancel, failure)',
    example: 'success',
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
