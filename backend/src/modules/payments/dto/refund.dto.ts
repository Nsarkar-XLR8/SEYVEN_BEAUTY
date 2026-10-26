import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class ProcessRefundDto {
  @ApiProperty({
    description: 'Order UUID or Payment Transaction UUID to refund',
    example: 'd3b07384-d113-4a0e-bc21-7e3e23075678',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Payment Transaction ID to refund specifically',
  })
  @IsUUID()
  @IsOptional()
  paymentTransactionId?: string;

  @ApiProperty({
    description: 'Amount in BDT to refund',
    example: 150,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amountBdt: number;

  @ApiProperty({
    description: 'Business reason for issuing the refund',
    example: 'Customer cancelled prior to dispatch; unfulfillable out-of-stock item',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
