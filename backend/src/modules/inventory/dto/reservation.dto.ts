import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class ReserveStockItemDto {
  @ApiProperty({
    description: 'Product variant UUID or bundle variant UUID',
    example: 'd9b2d63d-a233-4123-8478-f7b767355201',
  })
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Quantity of units to allocate from inventory lots',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
}

export class ReserveStockDto {
  @ApiProperty({
    description: 'List of items and quantities to reserve',
    type: [ReserveStockItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReserveStockItemDto)
  items: ReserveStockItemDto[];

  @ApiPropertyOptional({
    description: 'Optional cart ID associated with the temporary reservation',
    example: 'cart_98a76bc3',
  })
  @IsOptional()
  @IsString()
  cartId?: string;

  @ApiPropertyOptional({
    description: 'Optional authenticated user UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({
    description: 'Reservation TTL in seconds (default: 900 seconds = 15 minutes, max 3600 seconds)',
    example: 900,
    default: 900,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  ttlSeconds?: number;
}

export class ConfirmStockDto {
  @ApiProperty({
    description: 'Unique reservation UUID to permanently commit to database lots',
    example: 'e3f01c8c-687e-4024-8178-0cf2e25ad911',
  })
  @IsUUID('4')
  @IsNotEmpty()
  reservationId: string;

  @ApiPropertyOptional({
    description: 'Placed order UUID committing this inventory allocation',
    example: 'f1d3c52e-5034-4bd3-87ab-3932e6a18d99',
  })
  @IsOptional()
  @IsUUID('4')
  orderId?: string;
}

export class ReleaseStockDto {
  @ApiProperty({
    description: 'Unique reservation UUID to release back into available pool',
    example: 'e3f01c8c-687e-4024-8178-0cf2e25ad911',
  })
  @IsUUID('4')
  @IsNotEmpty()
  reservationId: string;

  @ApiPropertyOptional({
    description: 'Reason for releasing the reservation',
    example: 'USER_CART_ABANDONED',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
