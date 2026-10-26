import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FacetFilterDto {
  @ApiPropertyOptional({ description: 'Filter facets by category slug', example: 'serums-ampoules' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Filter facets by category ID', example: 'c1d2e3f4-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by skin concern tag', example: 'acne' })
  @IsOptional()
  @IsString()
  concern?: string;

  @ApiPropertyOptional({ description: 'Filter by routine step tag', example: 'serum' })
  @IsOptional()
  @IsString()
  routine?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum price in BDT', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price in BDT', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Only include pregnancy-safe products', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPregnancySafe?: boolean;

  @ApiPropertyOptional({ description: 'Only include lactation-safe products', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isLactationSafe?: boolean;

  @ApiPropertyOptional({ description: 'Filter products strictly in stock', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStockOnly?: boolean;
}
