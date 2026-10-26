import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BundleComponentInputDto {
  @IsNotEmpty()
  @IsUUID()
  childVariantId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateVariantDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  volumeMlG!: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  priceBdt!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  compareAtPriceBdt?: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  cogsBdt!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGrams?: number;

  @IsOptional()
  @IsBoolean()
  isBundle?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleComponentInputDto)
  bundleComponents?: BundleComponentInputDto[];
}
