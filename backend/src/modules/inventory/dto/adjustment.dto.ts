import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StockAdjustmentDto {
  @IsNotEmpty()
  @IsUUID()
  lotId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  newQuantity!: number;

  @IsNotEmpty()
  @IsString()
  reasonCode!: string; // 'MANUAL_CORRECTION' | 'DAMAGE_WRITE_OFF' | 'SAMPLE_DISBURSEMENT' | 'RETURNS_RESTOCK'

  @IsOptional()
  @IsString()
  notes?: string;
}
