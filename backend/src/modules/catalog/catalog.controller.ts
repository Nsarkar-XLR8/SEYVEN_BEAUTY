import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { FacetService } from './services/facet.service';
import { CloudinaryService } from './services/cloudinary.service';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateProductDto } from './dto/product.dto';
import { CreateVariantDto } from './dto/variant.dto';
import { UpdatePublicationStateDto } from './dto/state-transition.dto';
import { FacetFilterDto } from './dto/facet.dto';
import { TaxonomyQueryDto } from './dto/taxonomy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly facetService: FacetService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload product photo directly to Cloudinary global CDN' })
  @ApiResponse({ status: 201, description: 'Image uploaded and WebP CDN URL generated' })
  async uploadImage(
    @Body() body: { dataUrl?: string; imageUrl?: string; folder?: string },
  ) {
    const folder = body.folder || 'seyven/products';
    const source = body.dataUrl || body.imageUrl;
    if (!source) {
      throw new BadRequestException('Image dataUrl or imageUrl is required');
    }
    const uploaded = await this.cloudinaryService.uploadDataUrl(source, folder);
    return {
      success: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
      format: uploaded.format,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
    };
  }

  // ---------------- Category Endpoints ----------------
  @Post('categories')
  @ApiOperation({ summary: 'Create a new hierarchical product category (Admin/Manager)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List hierarchical category tree' })
  @ApiResponse({ status: 200, description: 'Category tree retrieved successfully' })
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a product category from database' })
  @ApiParam({ name: 'id', description: 'Category ID or Slug' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  // ---------------- Facets & Taxonomy Endpoints ----------------
  @Get('facets')
  @ApiOperation({ summary: 'Dynamic real-time aggregate facet counts (Skin types, concerns, routines, price brackets)' })
  @ApiResponse({ status: 200, description: 'Dynamic facet counts' })
  getFacets(@Query() filter: FacetFilterDto) {
    return this.facetService.getFacets(filter);
  }

  @Get('taxonomy')
  @ApiOperation({ summary: 'Query catalog by skin concern, daily routine phase, and formulation texture' })
  @ApiResponse({ status: 200, description: 'Filtered products with pagination and stock metadata' })
  queryTaxonomy(@Query() query: TaxonomyQueryDto) {
    return this.facetService.queryTaxonomy(query);
  }

  // ---------------- Product Endpoints ----------------
  @Get('products')
  @ApiOperation({ summary: 'List published formulations (or all formulations if includeDrafts=true)' })
  @ApiQuery({ name: 'includeDrafts', required: false, type: Boolean, description: 'Include DRAFT products for admin desk' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  listProducts(@Query('includeDrafts') includeDrafts?: string) {
    return this.catalogService.listProducts(includeDrafts === 'true');
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a new product with safety criteria and skin profiles' })
  @ApiResponse({ status: 201, description: 'Product created and published across storefront' })
  createProduct(@Body() dto: any) {
    return this.catalogService.createProduct(dto);
  }

  @Patch('products/:id/state')
  @ApiOperation({ summary: 'Transition product publication lifecycle state' })
  @ApiParam({ name: 'id', description: 'Product ID or Slug' })
  @ApiResponse({ status: 200, description: 'State updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  updatePublicationState(
    @Param('id') id: string,
    @Body() dto: UpdatePublicationStateDto,
  ) {
    return this.catalogService.updatePublicationState(id, dto.state);
  }

  @Patch('products/:id/pricing')
  @ApiOperation({ summary: 'Update product variant pricing directly in database' })
  @ApiParam({ name: 'id', description: 'Product ID or Slug or Variant SKU' })
  @ApiResponse({ status: 200, description: 'Price updated in Supabase PostgreSQL' })
  updateProductPrice(
    @Param('id') id: string,
    @Body() dto: { priceBdt: number; compareAtPriceBdt?: number; sku?: string },
  ) {
    return this.catalogService.updateProductPrice(id, dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product details, clinical specifications, and multi-variants' })
  @ApiParam({ name: 'id', description: 'Product ID or Slug' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product and all variants permanently from database' })
  @ApiParam({ name: 'id', description: 'Product ID or Slug' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  @Post('products/:id/preview-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate time-bound draft preview token' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 201, description: 'Preview token generated (1-hour TTL)' })
  generatePreviewToken(@Param('id') id: string) {
    return this.catalogService.generatePreviewToken(id);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Fetch product by slug with SEO metadata, lots, and variants' })
  @ApiParam({ name: 'slug', description: 'Product URL slug' })
  @ApiQuery({ name: 'previewToken', required: false, description: 'HMAC preview token for unpublished products' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found or not published' })
  getProductBySlug(
    @Param('slug') slug: string,
    @Query('previewToken') previewToken?: string,
  ) {
    return this.catalogService.getProductBySlug(slug, previewToken);
  }

  // ---------------- Variant Endpoints ----------------
  @Post('variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create SKU variant with volume/shade attributes and pricing' })
  @ApiResponse({ status: 201, description: 'Variant created' })
  @ApiResponse({ status: 400, description: 'Invalid variant or SKU collision' })
  createVariant(@Body() dto: CreateVariantDto) {
    return this.catalogService.createVariant(dto);
  }
}

