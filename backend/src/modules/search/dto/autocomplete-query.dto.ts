import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AutocompleteQueryDto {
  @ApiProperty({
    description: 'Partial search keyword for instant typeahead predictions',
    example: 'niaci',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  q: string;
}
