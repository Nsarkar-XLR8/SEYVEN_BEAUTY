import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class BookSteadfastConsignmentDto {
  @ApiProperty({
    description: 'Internal SEYVEN Order UUID to dispatch',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'orderId must be a valid UUIDv4' })
  @IsNotEmpty({ message: 'orderId is required' })
  orderId: string;

  @ApiPropertyOptional({
    description: 'Special courier handling instructions or fragile packaging tags',
    example: 'Handle with extreme care: Premium Glass Skincare Flacons',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  specialInstruction?: string;

  @ApiPropertyOptional({
    description: 'Approximate parcel weight in Kilograms (defaults to 0.5 kg if not specified)',
    example: 0.85,
    default: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1, { message: 'Weight must be at least 0.1 kg' })
  itemWeightKg?: number;
}
