import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateWaitlistSubscriptionDto {
  @ApiProperty({
    description: 'Bangladeshi customer mobile phone number for restock SMS alerts',
    example: '+8801712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: 'Phone number must be a valid Bangladeshi mobile number (e.g. +8801712345678 or 01712345678)',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Optional email address for restock email notification',
    example: 'customer@seyven.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Specific product variant UUID (if customer wants alert for specific size/shade)',
    example: 'd9b2d63d-a233-4123-8478-f7b767355201',
  })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;
}
