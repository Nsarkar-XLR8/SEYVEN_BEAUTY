import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { QueryRedirectsDto } from './dto/query-redirects.dto';
import { OgGeneratorService } from './services/og-generator.service';
import { RedirectService } from './services/redirect.service';
import { SitemapService } from './services/sitemap.service';

@ApiTags('Dynamic SEO, Luxury OpenGraph & URL Redirects')
@Controller()
export class SeoController {
  constructor(
    private readonly sitemapService: SitemapService,
    private readonly ogGeneratorService: OgGeneratorService,
    private readonly redirectService: RedirectService,
  ) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  @ApiOperation({
    summary: 'Dynamic SEO XML Sitemap',
    description:
      'Generates XML sitemap conforming to sitemaps.org 0.9 schema containing all published products, categories, and core canonical landing pages.',
  })
  @ApiProduces('application/xml')
  @ApiResponse({
    status: 200,
    description: 'Dynamic XML sitemap payload',
  })
  async getSitemapXml(): Promise<string> {
    return this.sitemapService.getSitemapXml();
  }

  @Get('og/product/:slug')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  @ApiOperation({
    summary: 'Dynamic luxury OpenGraph preview card generator',
    description:
      'Dynamically renders a 1200x630 vector SVG OpenGraph social preview card containing product name, live BDT price, active ingredients, and BSTI certification badge.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product URL slug',
    example: 'seyven-niacinamide-10-serum',
  })
  @ApiProduces('image/svg+xml')
  @ApiResponse({
    status: 200,
    description: 'Luxury OpenGraph vector SVG image',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductOgCard(@Param('slug') slug: string): Promise<string> {
    return this.ogGeneratorService.generateProductOgCard(slug);
  }

  @Get('admin/redirects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List 301/302 URL redirect rules',
    description:
      'Returns paginated list of configured permanent and temporary URL redirect rules with hit counters and last access timestamps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of redirect rules',
  })
  async getRedirects(@Query() query: QueryRedirectsDto) {
    return this.redirectService.getRedirects(query);
  }

  @Post('admin/redirects')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update managed 301/302 URL redirect rule',
    description:
      'Registers a permanent or temporary URL redirect from legacy path to target destination. Clears lookup cache automatically.',
  })
  @ApiResponse({
    status: 201,
    description: 'Redirect rule successfully created or updated',
  })
  @ApiResponse({ status: 400, description: 'Source and destination paths identical or invalid' })
  async createRedirect(@Body() dto: CreateRedirectDto) {
    return this.redirectService.createRedirect(dto);
  }

  @Get('redirects/resolve')
  @ApiOperation({
    summary: 'Resolve redirect for incoming path',
    description:
      'Public endpoint allowing frontend routing layer or Edge proxies to check if an incoming URL has an active 301/302 redirect destination.',
  })
  @ApiQuery({
    name: 'path',
    description: 'Incoming path to resolve',
    example: '/old-niacinamide',
  })
  @ApiResponse({
    status: 200,
    description: 'Redirect lookup resolution result',
  })
  async resolveRedirect(@Query('path') path: string) {
    return this.redirectService.resolveRedirect(path);
  }

  @Post('admin/sitemap/invalidate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Invalidate cached XML sitemap',
    description: 'Forces regeneration of sitemap.xml on next crawler hit.',
  })
  @ApiResponse({ status: 200, description: 'Sitemap cache successfully cleared' })
  async invalidateSitemap() {
    await this.sitemapService.invalidateSitemapCache();
    return { success: true, message: 'Sitemap cache invalidated successfully' };
  }
}
