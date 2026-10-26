import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BstiStatus, PublicationState } from '@prisma/client';

export class CreateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsNotEmpty()
  @IsString()
  titleEn!: string;

  @IsNotEmpty()
  @IsString()
  titleBn!: string;

  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @IsOptional()
  @IsString()
  shortDescriptionBn?: string;

  @IsOptional()
  @IsString()
  dermalProtocolEn?: string;

  @IsOptional()
  @IsString()
  dermalProtocolBn?: string;

  @IsOptional()
  @IsString()
  patchTestGuideEn?: string;

  @IsOptional()
  @IsString()
  patchTestGuideBn?: string;

  @IsOptional()
  @IsBoolean()
  isPregnancySafe?: boolean;

  @IsOptional()
  @IsBoolean()
  isLactationSafe?: boolean;

  @IsOptional()
  @IsEnum(BstiStatus)
  bstiStatus?: BstiStatus;

  @IsOptional()
  @IsString()
  bstiLicenseNumber?: string;

  @IsOptional()
  @IsEnum(PublicationState)
  publicationState?: PublicationState;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  priceBdt?: number;

  @IsOptional()
  @IsString()
  priceRangeBdt?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  images?: string[];

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  routineStep?: string;

  @IsOptional()
  @IsString()
  routinePeriod?: string;

  @IsOptional()
  @IsString()
  originCountry?: string;

  @IsOptional()
  @IsString()
  purposeTagEn?: string;

  @IsOptional()
  @IsString()
  purposeTagBn?: string;

  @IsOptional()
  @IsString()
  dermalStoryEn?: string;

  @IsOptional()
  @IsString()
  dermalStoryBn?: string;

  @IsOptional()
  keyActives?: any;

  @IsOptional()
  usageSteps?: any;

  @IsOptional()
  fullInci?: any;

  @IsOptional()
  @IsString()
  storageGuidanceEn?: string;

  @IsOptional()
  @IsString()
  storageGuidanceBn?: string;

  @IsOptional()
  skinTypes?: any;

  @IsOptional()
  @IsBoolean()
  bstiApproved?: boolean;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  variantsCount?: number;
}

