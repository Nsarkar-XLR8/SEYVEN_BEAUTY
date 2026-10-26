import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class BatchRecallDto {
  @IsNotEmpty()
  @IsString()
  batchNumber!: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsNotEmpty()
  @IsString()
  reason!: string;
}
