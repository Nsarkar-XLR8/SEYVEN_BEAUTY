import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendDirectSmsDto {
  @ApiProperty({
    example: '01712345678',
    description: 'Bangladeshi recipient phone number (local 017... or international +88017...)',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: 'SEYVEN: Your order SYV-202610-101 has been confirmed. Track: theseyven.com/track',
    description: 'SMS message text',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: false,
    description: 'If true, bypasses BTRC commercial quiet hours (e.g. OTP, security alerts)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    example: 'ORDER_PLACED',
    description: 'Categorization template name for audit log',
    default: 'MANUAL_BROADCAST',
  })
  @IsString()
  @IsOptional()
  templateName?: string;
}
