import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum TaxonomySortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  TITLE_ASC = 'title_asc',
}

export class TaxonomyQueryDto {
  @ApiPropertyOptional({
    description: 'Skin concern filter (e.g. acne, barrier_repair, hyperpigmentation, anti_aging, hydration, sensitivity)',
    example: 'barrier_repair',
  })
  @IsOptional()
  @IsString()
  concern?: string;

  @ApiPropertyOptional({
    description: 'Daily routine step (e.g. cleanser, toner, serum, moisturizer, sunscreen, night_repair)',
    example: 'serum',
  })
  @IsOptional()
  @IsString()
  routine?: string;

  @ApiPropertyOptional({
    description: 'Formulation texture (e.g. gel, cream, serum, emulsion, balm, foam, mist)',
    example: 'gel',
  })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({
    description: 'Skin type compatibility (e.g. oily, dry, combination, sensitive, normal)',
    example: 'sensitive',
  })
  @IsOptional()
  @IsString()
  skinType?: string;

  @ApiPropertyOptional({ description: 'Category slug filter', example: 'serums-ampoules' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Category UUID filter' })
  @IsOptional()
  @IsString()
  categoryId?: string;

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

  @ApiPropertyOptional({ description: 'Pregnancy safe filter', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPregnancySafe?: boolean;

  @ApiPropertyOptional({ description: 'Lactation safe filter', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isLactationSafe?: boolean;

  @ApiPropertyOptional({ description: 'Only return in-stock products', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStockOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sorting criteria',
    enum: TaxonomySortBy,
    default: TaxonomySortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(TaxonomySortBy)
  sortBy?: TaxonomySortBy = TaxonomySortBy.NEWEST;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
