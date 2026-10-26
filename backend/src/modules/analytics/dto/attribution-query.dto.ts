import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AttributionModelEnum {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
}

export class AttributionQueryDto {
  @ApiPropertyOptional({
    description: 'Reporting start date (ISO-8601 string or YYYY-MM-DD)',
    example: '2026-10-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Reporting end date (ISO-8601 string or YYYY-MM-DD)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Attribution calculation model',
    enum: AttributionModelEnum,
    default: AttributionModelEnum.LAST_TOUCH,
    example: AttributionModelEnum.LAST_TOUCH,
  })
  @IsOptional()
  @IsEnum(AttributionModelEnum)
  model?: AttributionModelEnum = AttributionModelEnum.LAST_TOUCH;

  @ApiPropertyOptional({
    description: 'Filter by specific campaign name',
    example: 'retinol_launch_q4',
  })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific traffic source',
    example: 'facebook',
  })
  @IsOptional()
  @IsString()
  utmSource?: string;
}
