import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AddressItemDto {
  @ApiPropertyOptional({
    description: 'Address UUID if updating an existing address',
    example: 'a89c83de-2882-4fa7-bfb9-c98188173001',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Administrative Division of Bangladesh',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  division: string;

  @ApiProperty({
    description: 'District name',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    description: 'Thana / Upazila / Local delivery area',
    example: 'Gulshan-2',
  })
  @IsString()
  @IsNotEmpty()
  thanaArea: string;

  @ApiPropertyOptional({
    description: 'Courier Zone ID (1: Inside Dhaka, 2: Suburbs, 3: Outside Dhaka Major, 4: Remote Upazila)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  courierZoneId?: number;

  @ApiProperty({
    description: 'Street address with house/road/apartment details',
    example: 'House 14, Road 83, Gulshan-2, Dhaka',
  })
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiPropertyOptional({
    description: 'Nearby orientation landmark',
    example: 'Behind American Club',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({
    description: 'Set as default shipping address',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class ManageAddressesDto {
  @ApiProperty({
    description: 'List of saved shipping addresses for the customer',
    type: [AddressItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddressItemDto)
  addresses: AddressItemDto[];
}
