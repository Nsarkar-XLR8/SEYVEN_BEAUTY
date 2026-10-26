import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SteadfastWebhookDto {
  @ApiPropertyOptional({
    description: 'Notification event type',
    example: 'delivery_status',
  })
  @IsOptional()
  @IsString()
  notification_type?: string;

  @ApiProperty({
    description: 'Unique Steadfast Consignment ID',
    example: 9876543,
  })
  @IsNotEmpty({ message: 'consignment_id is required' })
  consignment_id: number | string;

  @ApiPropertyOptional({
    description: 'Merchant order invoice / order number',
    example: 'SYV-202610-A9F1B2',
  })
  @IsOptional()
  @IsString()
  invoice?: string;

  @ApiProperty({
    description: 'Real-time delivery status reported by courier',
    example: 'delivered',
  })
  @IsNotEmpty({ message: 'status is required' })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Public courier tracking code',
    example: 'SF9876543',
  })
  @IsOptional()
  @IsString()
  tracking_code?: string;

  @ApiPropertyOptional({
    description: 'Total COD balance collected by delivery rider in BDT',
    example: 1850,
  })
  @IsOptional()
  @IsNumber()
  collected_amount?: number;

  @ApiPropertyOptional({
    description: 'Status update note or reason code (e.g. customer unreachable, refused)',
    example: 'Delivered to customer doorstep with cash collected',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Timestamp of the status change',
    example: '2026-10-11T14:20:00Z',
  })
  @IsOptional()
  @IsString()
  updated_at?: string;
}
