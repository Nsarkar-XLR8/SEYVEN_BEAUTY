import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRedirectDto {
  @ApiProperty({
    description: 'Incoming legacy source URL path (e.g. /old-serum-catalog or /products/legacy-slug)',
    example: '/products/old-niacinamide',
  })
  @IsString()
  @IsNotEmpty()
  sourcePath: string;

  @ApiProperty({
    description: 'Destination target URL path (e.g. /products/seyven-niacinamide-10)',
    example: '/products/seyven-niacinamide-10',
  })
  @IsString()
  @IsNotEmpty()
  targetPath: string;

  @ApiPropertyOptional({
    description: 'HTTP Redirect Status Code (301 Permanent or 302 Temporary)',
    example: 301,
    default: 301,
  })
  @IsOptional()
  @IsIn([301, 302, 307, 308])
  statusCode?: number = 301;

  @ApiPropertyOptional({
    description: 'Whether the redirect rule is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
