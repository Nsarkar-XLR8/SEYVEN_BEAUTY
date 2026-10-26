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

export class InitSSLCommerzPaymentDto {
  @ApiProperty({
    description: 'Order UUID to initialize SSLCommerz session for',
    example: 'd3b07384-d113-4a0e-bc21-7e3e23075678',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    enum: PaymentType,
    description: 'Type of SSLCommerz payment: advance fee or full prepayment',
    default: PaymentType.FULL_PREPAYMENT,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType = PaymentType.FULL_PREPAYMENT;

  @ApiPropertyOptional({
    description: 'Custom amount in BDT if advance or partial',
    example: 150,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amountBdt?: number;

  @ApiPropertyOptional({
    description: 'Custom success redirect URL',
  })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Custom fail redirect URL',
  })
  @IsString()
  @IsOptional()
  failUrl?: string;

  @ApiPropertyOptional({
    description: 'Custom cancel redirect URL',
  })
  @IsString()
  @IsOptional()
  cancelUrl?: string;
}

export class SSLCommerzIpnDto {
  @ApiProperty({ description: 'Unique Transaction ID sent to gateway' })
  @IsString()
  @IsNotEmpty()
  tran_id: string;

  @ApiProperty({ description: 'Validation ID assigned by SSLCommerz' })
  @IsString()
  @IsNotEmpty()
  val_id: string;

  @ApiProperty({ description: 'Amount received' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Transaction status (VALID, VALIDATED, FAILED, CANCELLED)' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: 'Bank transaction ID' })
  @IsString()
  @IsOptional()
  bank_tran_id?: string;

  @ApiPropertyOptional({ description: 'Card or MFS type used (e.g. BKASH-BKash, VISA-Dutch Bangla Bank)' })
  @IsString()
  @IsOptional()
  card_type?: string;

  @ApiPropertyOptional({ description: 'Cryptographic hash signature for verification' })
  @IsString()
  @IsOptional()
  verify_sign?: string;

  @ApiPropertyOptional({ description: 'Value A custom parameter (orderId)' })
  @IsString()
  @IsOptional()
  value_a?: string;

  @ApiPropertyOptional({ description: 'Value B custom parameter (paymentType)' })
  @IsString()
  @IsOptional()
  value_b?: string;
}
