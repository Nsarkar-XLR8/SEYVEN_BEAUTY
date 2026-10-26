import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuickTrackQueryDto {
  @ApiProperty({
    description: 'Human-readable Order Number (e.g. SYV-202610-A9F1B2) or Order UUID',
    example: 'SYV-202610-A9F1B2',
  })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiPropertyOptional({
    description: 'Contact phone number associated with the order (E.164 or local 01XXXXXXXXX)',
    example: '01712345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
