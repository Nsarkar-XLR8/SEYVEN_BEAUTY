import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: 'd9e5b721-729c-4eb2-a6f7-b732e4d0d829',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Selected Product Variant SKU ID',
    example: 'f8c4b123-4567-4890-a123-b456789abcde',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Quantity to add to cart',
    default: 1,
    minimum: 1,
    maximum: 20,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number = 1;

  @ApiPropertyOptional({
    description: 'Optional routine step tag if added from dermal diagnostic quiz',
    example: 'Step 1: AM Gentle Cleanser',
  })
  @IsOptional()
  @IsString()
  routineStep?: string;

  @ApiPropertyOptional({
    description: 'Guest session token if unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for line item (set to 0 to remove item)',
    minimum: 0,
    maximum: 50,
    example: 2,
  })
  @IsInt()
  @Min(0)
  @Max(50)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Guest session token if unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;
}

export class MergeCartDto {
  @ApiProperty({
    description: 'Guest session token to merge into authenticated user account',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsString()
  @IsNotEmpty()
  guestToken: string;
}

export class GetCartQueryDto {
  @ApiPropertyOptional({
    description: 'Guest session token if unauthenticated',
    example: 'guest_9f8b4c2e-841a-4d7a-b9a5-7b58498f3b1a',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;
}


