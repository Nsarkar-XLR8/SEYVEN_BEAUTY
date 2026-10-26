import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { AutocompleteQueryDto } from './dto/autocomplete-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Fuzzy full-text search with typo tolerance, trigrams, and Bangla/Banglish synonym expansion',
    description: 'Searches across products, categories, protocols, and INCI ingredients with phonetic keyword expansion.',
  })
  @ApiResponse({ status: 200, description: 'Ranked search results with relevance scores and stock status' })
  search(
    @Query() dto: SearchQueryDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    const userId = (req as any).user?.userId;

    return this.searchService.search(dto, { ip, userAgent, userId });
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Predictive typeahead autocomplete delivering instant query, product, category, and ingredient suggestions',
  })
  @ApiResponse({ status: 200, description: 'Typeahead suggestions' })
  autocomplete(@Query() dto: AutocompleteQueryDto) {
    return this.searchService.autocomplete(dto.q);
  }

  @Get('analytics/zero-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin merchandising intelligence: Top zero-result search queries and missed demand',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max logs to inspect (default: 50)' })
  @ApiResponse({ status: 200, description: 'Aggregated zero-result telemetry reports' })
  getZeroResultAnalytics(@Query('limit') limit?: number) {
    return this.searchService.getZeroResultAnalytics(limit ? Number(limit) : 50);
  }
}
