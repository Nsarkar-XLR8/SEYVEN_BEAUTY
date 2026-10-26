import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({
    description: 'Number of loyalty points to redeem (Minimum 10 points)',
    example: 200,
    minimum: 10,
  })
  @IsInt()
  @Min(10, { message: 'Minimum redemption threshold is 10 points.' })
  pointsToRedeem: number;

  @ApiProperty({
    description: 'Total checkout cart value before loyalty discount in BDT',
    example: 2500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Cart total must be greater than 0 BDT.' })
  cartTotalBdt: number;
}
