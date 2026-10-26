import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BookPathaoConsignmentDto {
  @ApiProperty({
    description: 'Order UUID to book with Pathao Courier',
    example: 'd3b07384-d113-46fb-9c8e-a9b3112b07e6',
  })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiPropertyOptional({
    description: 'Pathao merchant store ID. Defaults to configured environment store ID.',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  storeId?: number;

  @ApiPropertyOptional({
    description: 'Special courier handling or customer delivery notes',
    example: 'Handle with care - Fragile glass bottle cosmetic serum',
  })
  @IsOptional()
  @IsString()
  specialInstruction?: string;

  @ApiPropertyOptional({
    description: 'Package weight in Kilograms (e.g. 0.5 kg)',
    example: 0.5,
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  itemWeightKg?: number = 0.5;

  @ApiPropertyOptional({
    description: 'Pathao Destination City ID (e.g. 1 for Dhaka Metro)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  recipientCityId?: number;

  @ApiPropertyOptional({
    description: 'Pathao Destination Zone ID',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  recipientZoneId?: number;

  @ApiPropertyOptional({
    description: 'Pathao Destination Area ID',
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  recipientAreaId?: number;
}
