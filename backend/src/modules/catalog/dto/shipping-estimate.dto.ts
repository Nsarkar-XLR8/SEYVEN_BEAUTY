import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EstimateDeliveryDto {
  @ApiProperty({
    description: 'Destination administrative division (e.g. Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh)',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  division: string;

  @ApiPropertyOptional({
    description: 'Destination district (e.g. Dhaka, Gazipur, Narayanganj, Chittagong, Sylhet)',
    example: 'Dhaka',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Destination thana / sub-district / area (e.g. Gulshan, Dhanmondi, Uttara, Mirpur)',
    example: 'Gulshan',
  })
  @IsOptional()
  @IsString()
  thana?: string;

  @ApiPropertyOptional({
    description: 'Total parcel estimated weight in grams',
    example: 350,
    default: 250,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  weightGrams?: number = 250;

  @ApiPropertyOptional({
    description: 'Cart total in BDT to evaluate free shipping threshold (৳2,000 threshold)',
    example: 2450,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmountBdt?: number;
}
