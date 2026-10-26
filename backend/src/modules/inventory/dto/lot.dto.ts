import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class CreateInventoryLotDto {
  @IsNotEmpty()
  @IsUUID()
  variantId!: string;

  @IsNotEmpty()
  @IsString()
  batchNumber!: string;

  @IsNotEmpty()
  @IsDateString()
  manufacturingDate!: string;

  @IsNotEmpty()
  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  paoMonths?: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  initialQuantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minShelfLifeDays?: number;
}
