import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { HygieneInspectionOutcome } from '@prisma/client';

export class InspectRmaDto {
  @ApiProperty({
    description: 'Outcome of physical cosmetic hygiene & authenticity inspection',
    enum: HygieneInspectionOutcome,
    example: HygieneInspectionOutcome.PASSED_VALID_DEFECT,
  })
  @IsEnum(HygieneInspectionOutcome)
  outcome: HygieneInspectionOutcome;

  @ApiProperty({
    description: 'Whether the cosmetic protective seal or shrink wrap is completely intact and unopened',
    example: false,
  })
  @IsBoolean()
  isSealIntact: boolean;

  @ApiProperty({
    description: 'Staff inspection notes detailing bottle seal status, batch authenticity, and damage verification',
    example: 'Pump crack verified under magnification; batch lot matches dispatch record. Seal broken in transit.',
  })
  @IsString()
  @IsNotEmpty()
  inspectionNotes: string;

  @ApiProperty({
    description: 'Whether goods are safe and eligible to be restocked into active inventory lots (Strictly false for unsealed cosmetics)',
    example: false,
  })
  @IsBoolean()
  isRestockable: boolean;

  @ApiPropertyOptional({
    description: 'Inspected and approved refund value in BDT (may be adjusted for partial returns)',
    example: 1850,
  })
  @IsOptional()
  @IsNumber()
  approvedRefundAmountBdt?: number;

  @ApiPropertyOptional({
    description: 'List of specific RMA Item IDs approved during partial inspection',
    example: ['item-uuid-1', 'item-uuid-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedItemIds?: string[];
}
