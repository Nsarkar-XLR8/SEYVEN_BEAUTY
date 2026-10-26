import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
// Generated Prisma Enums
import { CallVerificationOutcome } from '@prisma/client';

export class LogCallVerificationDto {
  @ApiProperty({
    enum: CallVerificationOutcome,
    description: 'Outcome of the customer phone call verification attempt',
    example: CallVerificationOutcome.CONFIRMED,
  })
  @IsEnum(CallVerificationOutcome)
  @IsNotEmpty()
  callOutcome!: CallVerificationOutcome;

  @ApiPropertyOptional({
    description: 'Detailed agent notes on call dialogue, address clarifications, or customer instructions',
    example: 'Customer confirmed address details, requested delivery on Friday afternoon',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Follow-up callback schedule timestamp if customer was busy or requested rescheduling',
    example: '2026-10-09T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;
}
