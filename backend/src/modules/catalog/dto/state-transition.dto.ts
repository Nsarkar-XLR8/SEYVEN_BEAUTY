import { IsEnum, IsNotEmpty } from 'class-validator';
import { PublicationState } from '@prisma/client';

export class UpdatePublicationStateDto {
  @IsNotEmpty()
  @IsEnum(PublicationState)
  state!: PublicationState;
}
