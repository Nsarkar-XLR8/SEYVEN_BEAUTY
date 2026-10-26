import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RefundChannel } from '@prisma/client';

export class SettleRmaDto {
  @ApiProperty({
    description: 'Final settled refund amount in BDT to disburse',
    example: 1850,
  })
  @IsNumber()
  @Min(1)
  approvedRefundAmountBdt: number;

  @ApiProperty({
    description: 'Channel through which the refund is disbursed',
    enum: RefundChannel,
    example: RefundChannel.ORIGINAL_PAYMENT_METHOD,
  })
  @IsEnum(RefundChannel)
  refundChannel: RefundChannel;

  @ApiPropertyOptional({
    description: 'MFS / Gateway refund transaction reference ID (e.g. bKash refund TRX, SSLCommerz refund ref)',
    example: 'RFD_BKASH_994821',
  })
  @IsOptional()
  @IsString()
  refundTrxId?: string;

  @ApiPropertyOptional({
    description: 'Settlement notes or staff remarks for accounting reconciliation',
    example: 'Refund disbursed via bKash Merchant Reverse API. NBR Mushak-6.7 issued automatically.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
