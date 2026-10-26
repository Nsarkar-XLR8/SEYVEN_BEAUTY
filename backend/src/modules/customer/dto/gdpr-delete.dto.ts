import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GdprDeleteAccountDto {
  @ApiProperty({
    description: 'Mandatory confirmation passphrase matching "DELETE_MY_ACCOUNT"',
    example: 'DELETE_MY_ACCOUNT',
  })
  @IsString()
  @IsNotEmpty()
  confirmationText: string;

  @ApiPropertyOptional({
    description: 'Optional customer feedback or reason for account deletion',
    example: 'Closing account pursuant to Digital Security Act 2026 rights.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
