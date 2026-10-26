import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubscribeNewsletterDto {
  @ApiProperty({
    example: 'client@seyven.com.bd',
    description: 'Email address to subscribe to SEYVEN private client newsletters',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address cannot be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiPropertyOptional({
    example: 'Amina Khan',
    description: 'Optional client full name for bespoke email greetings',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

  @ApiPropertyOptional({
    example: 'FOOTER',
    description: 'Source where subscriber joined (e.g., FOOTER, CHECKOUT, POPUP)',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
