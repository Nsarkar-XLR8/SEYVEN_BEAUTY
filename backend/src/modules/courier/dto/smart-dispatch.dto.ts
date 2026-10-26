import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum CourierPartner {
  PATHAO = 'PATHAO',
  STEADFAST = 'STEADFAST',
}

export class SmartDispatchDto {
  @ApiProperty({
    description: 'Internal SEYVEN Order UUID to dispatch',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'orderId must be a valid UUIDv4' })
  @IsNotEmpty({ message: 'orderId is required' })
  orderId!: string;

  @ApiPropertyOptional({
    description:
      'Preferred courier override (defaults to PATHAO as primary, with STEADFAST as backup)',
    enum: CourierPartner,
    default: CourierPartner.PATHAO,
  })
  @IsOptional()
  @IsEnum(CourierPartner)
  preferredCourier?: CourierPartner = CourierPartner.PATHAO;

  @ApiPropertyOptional({
    description: 'Special courier handling or fragile cosmetic tags',
    example: 'Fragile: Luxury Skincare Glass Flacons',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialInstruction?: string;

  @ApiPropertyOptional({
    description: 'Package weight in Kilograms (defaults to 0.5 kg)',
    example: 0.5,
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  itemWeightKg?: number = 0.5;

  @ApiPropertyOptional({
    description: 'Pathao Destination City ID (optional override)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  recipientCityId?: number;

  @ApiPropertyOptional({
    description: 'Pathao Destination Zone ID (optional override)',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  recipientZoneId?: number;

  @ApiPropertyOptional({
    description: 'Pathao Destination Area ID (optional override)',
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  recipientAreaId?: number;
}
