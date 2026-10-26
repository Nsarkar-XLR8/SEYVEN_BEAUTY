import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RmaStatus } from '@prisma/client';

export class QueryRmaDto {
  @ApiPropertyOptional({
    description: 'Filter by RMA status',
    enum: RmaStatus,
    example: RmaStatus.SUBMITTED,
  })
  @IsOptional()
  @IsEnum(RmaStatus)
  status?: RmaStatus;

  @ApiPropertyOptional({
    description: 'Filter by customer phone number',
    example: '01712345678',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Filter by Order Number (SYV-YYYYMM-XXXX)',
    example: 'SYV-202610-A9F1B2',
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'Page limit for pagination',
    default: 20,
    example: 20,
  })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Page offset for pagination',
    default: 1,
    example: 1,
  })
  @IsOptional()
  page?: number = 1;
}
