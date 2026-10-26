import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AcceptedItemDto {
  @ApiProperty({
    description: 'Order item UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4')
  @IsNotEmpty()
  orderItemId!: string;

  @ApiProperty({
    description: 'Accepted quantity kept by customer (must be >= 0 and <= original quantity)',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  acceptedQuantity!: number;
}

export class PartialDeliveryDto {
  @ApiProperty({
    description: 'List of accepted item quantities',
    type: [AcceptedItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptedItemDto)
  acceptedItems!: AcceptedItemDto[];

  @ApiPropertyOptional({
    description: 'Actual COD cash collected at doorstep by courier delivery rider (BDT)',
    example: 1250,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  collectedAmountBdt?: number;

  @ApiPropertyOptional({
    description: 'Reason for doorstep refusal of rejected items',
    example: 'Customer inspected parcel at doorstep and rejected duplicate serum',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
