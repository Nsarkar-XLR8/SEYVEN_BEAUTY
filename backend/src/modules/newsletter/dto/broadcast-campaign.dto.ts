import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BroadcastCampaignDto {
  @ApiProperty({
    example: 'Eid Ul Fitr 2026 Celebration - 7% Privilege Savings',
    description: 'Internal campaign title for admin record and analytics',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'A Festive Sanctuary Privilege: Enjoy 7% Savings on Curated Rituals',
    description: 'Email subject line shown to recipients',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    example: 'Exclusive Eid beauty privileges curated for Bangladeshi dermal climate.',
    description: 'Short pre-header text shown in email clients before opening',
  })
  @IsOptional()
  @IsString()
  previewText?: string;

  @ApiProperty({
    example: '<p>Dear Client,</p><p>In celebration of this blessed Eid, we invite you to experience <strong>7% privilege savings</strong> on all authentic international skincare formulations.</p>',
    description: 'Rich text HTML formatted message composed by the administrator',
  })
  @IsString()
  @IsNotEmpty()
  contentHtml: string;

  @ApiPropertyOptional({
    example: 'EID7',
    description: 'Optional promo coupon code to highlight in gold luxury banner',
  })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional({
    example: 'Festive Eid Privilege: 7% Off Across All Skincare Rituals',
    description: 'Optional highlighted promotional banner headline',
  })
  @IsOptional()
  @IsString()
  discountBanner?: string;

  @ApiPropertyOptional({
    example: 'ALL_SUBSCRIBERS',
    enum: ['ALL_SUBSCRIBERS', 'VIP_CUSTOMERS', 'ALL_CUSTOMERS'],
    default: 'ALL_SUBSCRIBERS',
    description: 'Audience segment to broadcast email campaign to',
  })
  @IsOptional()
  @IsString()
  targetAudience?: string;
}
