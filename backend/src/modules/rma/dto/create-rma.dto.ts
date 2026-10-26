import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RefundChannel, RmaReason } from '@prisma/client';

export class RmaItemSubmissionDto {
  @ApiProperty({
    description: 'Order item UUID being returned',
    example: 'c39d89ef-3d91-4e78-9e12-8812f86d1101',
  })
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({
    description: 'Quantity of units being returned',
    example: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Specific return reason for this item if different from primary',
    enum: RmaReason,
    example: RmaReason.TRANSIT_DAMAGE,
  })
  @IsOptional()
  @IsEnum(RmaReason)
  reason?: RmaReason;
}

export class CreateRmaRequestDto {
  @ApiProperty({
    description: 'Order ID (UUID) or Order Number (SYV-YYYYMM-XXXX)',
    example: 'SYV-202610-A9F1B2',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Customer contact phone number',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({
    description: 'Customer full name',
    example: 'Ayesha Rahman',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({
    description: 'Primary reason for return request',
    enum: RmaReason,
    example: RmaReason.TRANSIT_DAMAGE,
  })
  @IsEnum(RmaReason)
  primaryReason: RmaReason;

  @ApiProperty({
    description: 'Detailed description of the defect, transit damage, or reason for return',
    example: 'Bottle pump mechanism was fractured upon delivery and emulsion leaked inside tamper-evident bubble seal.',
  })
  @IsString()
  @IsNotEmpty()
  reasonDetails: string;

  @ApiProperty({
    description: 'Mandatory photographic evidence URLs verifying product state, lot batch number, and seal condition',
    example: ['https://storage.seyven.com/rma/evidence-damage-01.jpg'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one photo evidence URL is mandatory for RMA processing' })
  @IsString({ each: true })
  photoEvidenceUrls: string[];

  @ApiPropertyOptional({
    description: 'Optional unboxing video or product demonstration URLs',
    example: ['https://storage.seyven.com/rma/unboxing-video.mp4'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoEvidenceUrls?: string[];

  @ApiPropertyOptional({
    description: 'Customer preferred refund method',
    enum: RefundChannel,
    default: RefundChannel.ORIGINAL_PAYMENT_METHOD,
    example: RefundChannel.ORIGINAL_PAYMENT_METHOD,
  })
  @IsOptional()
  @IsEnum(RefundChannel)
  preferredRefundChannel?: RefundChannel = RefundChannel.ORIGINAL_PAYMENT_METHOD;

  @ApiPropertyOptional({
    description: 'MFS wallet number (bKash/Nagad/Rocket) for refund disbursement if COD was used',
    example: '01712345678',
  })
  @IsOptional()
  @IsString()
  refundWalletNumber?: string;

  @ApiProperty({
    description: 'Itemized list of products included in the RMA',
    type: [RmaItemSubmissionDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RmaItemSubmissionDto)
  items: RmaItemSubmissionDto[];
}
