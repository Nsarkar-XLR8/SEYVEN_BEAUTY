import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RecordRtoExpenseDto {
  @ApiProperty({
    description: 'Courier partner responsible for RTO shipment (e.g. PATHAO, STEADFAST)',
    example: 'STEADFAST',
  })
  @IsString()
  @IsNotEmpty()
  courier!: string;

  @ApiPropertyOptional({
    description: 'Courier consignment reference or parcel tracking number',
    example: 'SF9876543',
  })
  @IsOptional()
  @IsString()
  consignmentId?: string;

  @ApiProperty({
    description: 'Forward shipping fee originally charged by courier (BDT)',
    example: 60,
  })
  @IsNumber()
  @Min(0)
  forwardShippingFeeBdt!: number;

  @ApiProperty({
    description: 'Return shipping fee charged by courier to return parcel to warehouse (BDT)',
    example: 60,
  })
  @IsNumber()
  @Min(0)
  returnShippingFeeBdt!: number;

  @ApiProperty({
    description: 'Reason code for courier delivery failure / return to origin',
    example: 'CUSTOMER_REJECTED_AT_DOORSTEP',
  })
  @IsString()
  @IsNotEmpty()
  rtoReason!: string;

  @ApiPropertyOptional({
    description: 'Fulfillment operator inspection notes or delivery attempt logs',
    example: 'Courier attempted 3 calls, customer unreachable at Dhanmondi address',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Automatically release and restock returned items into active inventory lots',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  releaseStock?: boolean = true;
}
