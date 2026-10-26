import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ManifestCourierFilter {
  PATHAO = 'PATHAO',
  STEADFAST = 'STEADFAST',
  ALL = 'ALL',
}

export enum ManifestExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
}

export class ExportManifestDto {
  @ApiPropertyOptional({
    description: 'Filter orders by assigned courier partner',
    enum: ManifestCourierFilter,
    default: ManifestCourierFilter.ALL,
  })
  @IsOptional()
  @IsEnum(ManifestCourierFilter)
  courier?: ManifestCourierFilter = ManifestCourierFilter.ALL;

  @ApiPropertyOptional({
    description: 'Export format: Vector PDF or RFC-4180 CSV',
    enum: ManifestExportFormat,
    default: ManifestExportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ManifestExportFormat)
  format?: ManifestExportFormat = ManifestExportFormat.PDF;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO string, e.g. 2026-10-01T00:00:00Z)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO string, e.g. 2026-10-31T23:59:59Z)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum orders to include in manifest (max 500)',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}
