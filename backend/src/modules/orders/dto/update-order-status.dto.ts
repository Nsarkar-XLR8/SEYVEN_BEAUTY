import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'Target order status to transition to',
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Operational reason or justification for status change',
    example: 'Customer confirmed order verbally over phone call',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Internal staff notes associated with this transition',
    example: 'Dispatched to Gulshan distribution hub',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Courier tracking barcode or tracking URL code',
    example: 'STDF-2026-992144',
  })
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional({
    description: 'Courier partner consignment / booking reference ID',
    example: 'CSGN-8831924',
  })
  @IsOptional()
  @IsString()
  courierBookingId?: string;
}
