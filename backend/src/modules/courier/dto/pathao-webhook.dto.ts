import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PathaoWebhookDto {
  @ApiProperty({ description: 'Pathao Consignment ID', example: 'DB1029384' })
  @IsString()
  @IsNotEmpty()
  consignment_id!: string;

  @ApiProperty({ description: 'SEYVEN Merchant Order Number', example: 'SYV-202610-A9F1B2' })
  @IsString()
  @IsNotEmpty()
  merchant_order_id!: string;

  @ApiProperty({
    description: 'Pathao parcel delivery status',
    example: 'Delivered',
  })
  @IsString()
  @IsNotEmpty()
  order_status!: string;

  @ApiPropertyOptional({ description: 'Slug representation of order status', example: 'delivered' })
  @IsOptional()
  @IsString()
  order_status_slug?: string;

  @ApiPropertyOptional({ description: 'Cash collected by rider at doorstep in BDT', example: 1320 })
  @IsOptional()
  @IsNumber()
  collected_amount?: number;

  @ApiPropertyOptional({ description: 'Timestamp of status update', example: '2026-10-08T18:30:00.000Z' })
  @IsOptional()
  @IsString()
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Reason for return or cancellation if delivery failed', example: 'Customer unreachable after 3 delivery attempts' })
  @IsOptional()
  @IsString()
  reason?: string;
}
