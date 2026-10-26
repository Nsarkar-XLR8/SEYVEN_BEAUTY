import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WhatsAppChallengeQueryDto {
  @ApiPropertyOptional({ example: 'subscribe' })
  @IsString()
  @IsOptional()
  'hub.mode'?: string;

  @ApiPropertyOptional({ example: 'seyven_wa_webhook_verify_token_2026' })
  @IsString()
  @IsOptional()
  'hub.verify_token'?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  'hub.challenge'?: string;
}
