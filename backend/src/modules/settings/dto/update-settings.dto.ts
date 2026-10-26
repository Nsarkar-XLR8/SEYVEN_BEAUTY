import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  isVatEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRatePercent?: number;

  @IsOptional()
  @IsBoolean()
  isVatInclusive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  standardDeliveryDhakaBdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  standardDeliveryOutsideBdt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freeDeliveryThresholdBdt?: number;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  supportWhatsApp?: string;

  @IsOptional()
  @IsBoolean()
  isCampaignActive?: boolean;

  @IsOptional()
  @IsString()
  campaignTitle?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  campaignDiscountPercent?: number;

  @IsOptional()
  @IsString()
  campaignStartDate?: string | null;

  @IsOptional()
  @IsString()
  campaignEndDate?: string | null;
}
