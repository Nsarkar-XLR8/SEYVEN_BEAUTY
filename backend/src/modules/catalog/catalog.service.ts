import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CloudinaryService } from './services/cloudinary.service';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateProductDto } from './dto/product.dto';
import { CreateVariantDto } from './dto/variant.dto';
import { PreviewTokenService } from './services/preview-token.service';
import { NavigationService } from './services/navigation.service';
import { Prisma, PublicationState, LotStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  // Redis cache keys for enterprise distributed caching
  private readonly CACHE_PRODUCTS_ALL = 'catalog:products:all';
  private readonly CACHE_PRODUCTS_PUBLISHED = 'catalog:products:published';
  private readonly CACHE_CATEGORIES_ALL = 'catalog:categories:all';
  private readonly CACHE_PRODUCT_PREFIX = 'catalog:product:';

  private async invalidateProductCaches(productSlug?: string) {
    const keys = [this.CACHE_PRODUCTS_ALL, this.CACHE_PRODUCTS_PUBLISHED];
    if (productSlug) {
      keys.push(`${this.CACHE_PRODUCT_PREFIX}${productSlug}`);
    }
    await Promise.all(keys.map((k) => this.redis.del(k))).catch(() => {});
    await this.navigationService.invalidateCatalogCaches().catch(() => {});
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly previewTokenService: PreviewTokenService,
    private readonly navigationService: NavigationService,
    private readonly redis: RedisService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---------------- Category Management ----------------
  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        slug: dto.slug,
        nameEn: dto.nameEn,
        nameBn: dto.nameBn,
        description: dto.description,
        parentId: dto.parentId,
      },
    });

    // Invalidate Redis distributed cache immediately
    await this.redis.del(this.CACHE_CATEGORIES_ALL).catch(() => {});
    await this.navigationService.invalidateCatalogCaches();
    return category;
  }

  async listCategories() {
    // 1. Check Redis distributed cache
    try {
      const cached = await this.redis.get(this.CACHE_CATEGORIES_ALL);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    // 2. Primary Source of Truth: Supabase PostgreSQL
    try {
      const categories = await this.prisma.category.findMany({
        include: {
          children: true,
        },
        where: {
          parentId: null,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (categories && categories.length > 0) {
        // Cache in Redis for 1 hour (3600s)
        await this.redis.set(this.CACHE_CATEGORIES_ALL, JSON.stringify(categories), 3600).catch(() => {});
        return categories;
      }
    } catch (err: any) {
      this.logger.warn(`[Categories DB Query Notice] ${err?.message || err}`);
    }

    return [];
  }

  async deleteCategory(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const category = await this.prisma.category.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID or slug "${idOrSlug}" not found`);
    }

    const allCatIds = [category.id, ...category.children.map((c) => c.id)];

    // 1. Unlink any products assigned to this category or its subcategories
    await this.prisma.product.updateMany({
      where: { categoryId: { in: allCatIds } },
      data: { categoryId: null },
    });

    // 2. Delete child categories first
    if (category.children.length > 0) {
      await this.prisma.category.deleteMany({
        where: { parentId: category.id },
      });
    }

    // 3. Delete the category itself
    await this.prisma.category.delete({
      where: { id: category.id },
    });

    // 4. Invalidate Redis and navigation caches
    await Promise.all([
      this.redis.del(this.CACHE_CATEGORIES_ALL),
      this.invalidateProductCaches(),
    ]).catch(() => {});

    return { success: true, message: `Category "${category.nameEn}" successfully deleted.` };
  }

  // ---------------- Product Management ----------------
  async listProducts(includeDrafts: boolean = false) {
    const cacheKey = includeDrafts ? this.CACHE_PRODUCTS_ALL : this.CACHE_PRODUCTS_PUBLISHED;

    // 1. Check Redis distributed cache (< 5ms response)
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    // 2. Primary Persistent Store: Supabase PostgreSQL
    let dbProducts: any[] = [];
    try {
      const whereClause: Prisma.ProductWhereInput = includeDrafts
        ? {}
        : { publicationState: PublicationState.PUBLISHED };

      dbProducts = await this.prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      this.logger.warn(`[Prisma Product Query Notice] ${err?.message || err}`);
      dbProducts = [];
    }

    const formattedDbProducts = dbProducts.map((p) => {
      let meta: any = null;
      if (p.dermalProtocolEn) {
        try {
          meta = JSON.parse(p.dermalProtocolEn);
        } catch {}
      }

      const firstVariant = p.variants?.[0];
      const categoryName = p.category
        ? (p.category.nameEn || p.category.slug || 'Curated Formulation')
        : 'Curated Formulation';

      const brand = meta?.brand || 'Curated Formulation';
      const imageUrl = meta?.imageUrl || (Array.isArray(meta?.images) ? meta.images[0] : '') || '';
      const images = Array.isArray(meta?.images) && meta.images.length > 0 ? meta.images : (imageUrl ? [imageUrl] : []);

      // Variants mapping: multi-size support (5ml, 15ml, 30ml, 50ml, etc.)
      let variants: any[] = [];
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        variants = p.variants.map((v: any, idx: number) => {
          const volNum = v.volumeMlG ? parseFloat(String(v.volumeMlG)) : null;
          const volStr = v.volume || (volNum ? `${volNum} ML` : '50 ML');
          return {
            id: v.id || `var-${p.slug}-${idx}`,
            sku: v.sku || `SYV-${p.slug.toUpperCase().slice(0, 8)}-${idx}`,
            volume: volStr,
            titleEn: v.titleEn || volStr,
            titleBn: v.titleBn || volStr,
            priceBdt: Number(v.priceBdt) || 2450,
            inStock: v.isActive ?? true,
            stockCount: 50,
          };
        });
      } else {
        variants = [
          {
            id: `var-${p.id || p.slug}`,
            sku: `SYV-${p.slug.toUpperCase().slice(0, 10)}`,
            volume: firstVariant?.volumeMlG ? `${firstVariant.volumeMlG} ML` : '50 ML',
            priceBdt: firstVariant ? Number(firstVariant.priceBdt) : 2450,
            inStock: true,
            stockCount: 50,
          },
        ];
      }

      const routineStep = meta?.routineStep || (categoryName.toLowerCase().includes('sun') ? 'Sun Defence' : 'Treat & Serum');
      const purposeTagEn = meta?.purposeTagEn || (categoryName.toLowerCase().includes('sun') ? 'SUN DEFENCE // BROAD SPECTRUM' : 'TARGETED SERUM // ACTIVE CARE');
      const purposeTagBn = meta?.purposeTagBn || (categoryName.toLowerCase().includes('sun') ? 'সান প্রোটেকশন ও ফ্লুইড শিল্ড' : 'টার্গেটেড অ্যাক্টিভ সিরাম');

      return {
        id: p.id,
        slug: p.slug,
        titleEn: p.titleEn,
        titleBn: p.titleBn || p.titleEn,
        brand,
        category: categoryName,
        priceBdt: firstVariant ? Number(firstVariant.priceBdt) : 2450,
        priceRangeBdt: firstVariant ? `৳${Number(firstVariant.priceBdt).toLocaleString()}` : '৳2,450',
        imageUrl,
        images,
        volume: variants[0]?.volume || (firstVariant?.volumeMlG ? `${firstVariant.volumeMlG} ML` : '50 ML'),
        variants,
        variantsCount: variants.length,
        routineStep,
        purposeTagEn,
        purposeTagBn,
        keyActives: meta?.keyActives || [],
        fullInci: meta?.fullInci || '',
        usageSteps: meta?.usageSteps || [],
        state: p.publicationState || 'PUBLISHED',
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });

    // 3. Cache in Redis for 300 seconds (5 min) for zero-downtime high-throughput reads
    if (formattedDbProducts.length > 0) {
      await this.redis.set(cacheKey, JSON.stringify(formattedDbProducts), 300).catch(() => {});
    }

    return formattedDbProducts;
  }

  async createProduct(dto: any) {
    const rawCategory = dto.category;
    const categoryName =
      typeof rawCategory === 'object' && rawCategory
        ? rawCategory.nameEn || rawCategory.slug || 'Targeted Serums & Ampoules'
        : rawCategory || 'Targeted Serums & Ampoules';

    const getCategoryPurpose = (cat: string) => {
      const c = (cat || '').toLowerCase();
      if (c.includes('sun') || c.includes('fluid')) return 'SUN DEFENCE // BROAD SPECTRUM';
      if (c.includes('serum') || c.includes('ampoule')) return 'TARGETED SERUM // ACTIVE CARE';
      if (c.includes('toner') || c.includes('essence')) return 'HYDRATION PREP // BALANCING';
      if (c.includes('cream') || c.includes('moistur')) return 'BARRIER REPAIR // DEEP HYDRATION';
      if (c.includes('cleanse')) return 'PURIFYING // pH 5.5 BALANCED';
      return 'CLINICAL CARE // NOURISH';
    };

    const resolvedPurpose = dto.purposeTagEn || getCategoryPurpose(categoryName);

    // 1. Process and upload base64 images to Cloudinary CDN
    let uploadedImages: string[] = [];
    if (Array.isArray(dto.images) && dto.images.length > 0) {
      for (const img of dto.images) {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          try {
            const uploaded = await this.cloudinary.uploadDataUrl(img);
            uploadedImages.push(uploaded.url);
          } catch (err: any) {
            this.logger.warn(`[Cloudinary Upload Notice] ${err?.message || err}`);
          }
        } else if (img && typeof img === 'string') {
          uploadedImages.push(img);
        }
      }
    }

    let coverPhoto = dto.imageUrl || uploadedImages[0] || '';
    if (typeof coverPhoto === 'string' && coverPhoto.startsWith('data:image/')) {
      try {
        const uploaded = await this.cloudinary.uploadDataUrl(coverPhoto);
        coverPhoto = uploaded.url;
        if (!uploadedImages.includes(uploaded.url)) {
          uploadedImages.unshift(uploaded.url);
        }
      } catch (err: any) {
        this.logger.warn(`[Cloudinary Cover Upload Notice] ${err?.message || err}`);
      }
    }

    // 2. Multi-size variants mapping
    let variants: any[] = [];
    if (Array.isArray(dto.variants) && dto.variants.length > 0) {
      variants = dto.variants.map((v: any, idx: number) => ({
        id: v.id || `var-${Date.now()}-${idx}`,
        sku: v.sku || `SYV-${(dto.slug || 'PRD').toUpperCase().slice(0, 8)}-${(v.volume || 'STD').replace(/\s+/g, '')}`,
        titleEn: v.titleEn || `${v.volume || 'Standard'} Edition`,
        titleBn: v.titleBn || `${v.volume || 'স্ট্যান্ডার্ড'} সংস্করণ`,
        volume: v.volume || '50 ML',
        priceBdt: Number(v.priceBdt) || 2450,
        inStock: v.inStock ?? true,
        stockCount: 50,
      }));
    } else {
      const fallbackPrice = Number(dto.priceBdt) || 2450;
      variants = [
        {
          id: `var-${Date.now()}`,
          sku: dto.sku || `SYV-${(dto.slug || 'PRD').toUpperCase().slice(0, 10)}`,
          titleEn: `${dto.volume || '50 ML'} Standard Bottle`,
          titleBn: `${dto.volume || '50 ML'} বোতল`,
          volume: dto.volume || '50 ML',
          priceBdt: fallbackPrice,
          inStock: true,
          stockCount: 50,
        },
      ];
    }

    const prices = variants.map((v) => Number(v.priceBdt) || 2450);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRangeBdt = minPrice === maxPrice ? `৳${minPrice.toLocaleString()}` : `৳${minPrice.toLocaleString()} - ৳${maxPrice.toLocaleString()}`;

    const newProduct = {
      id: dto.id || `prod-${Date.now().toString(36)}`,
      slug: dto.slug || dto.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      titleEn: dto.titleEn,
      titleBn: dto.titleBn || dto.titleEn,
      brand: (dto.brand || '').trim() || 'Curated Formulation',
      category: categoryName,
      priceBdt: minPrice,
      priceRangeBdt,
      imageUrl: coverPhoto,
      images: uploadedImages.length > 0 ? uploadedImages : (coverPhoto ? [coverPhoto] : []),
      volume: variants[0]?.volume || dto.volume || '50 ML',
      variants,
      variantsCount: variants.length,
      routineStep: dto.routineStep || (categoryName.toLowerCase().includes('sun') ? 'Sun Defence' : 'Treat & Serum'),
      routinePeriod: dto.routinePeriod || (categoryName.toLowerCase().includes('sun') ? 'AM' : 'AM & PM'),
      originCountry: dto.originCountry || 'International Authenticity',
      isPregnancySafe: dto.isPregnancySafe ?? true,
      purposeTagEn: resolvedPurpose,
      purposeTagBn: dto.purposeTagBn || resolvedPurpose,
      dermalStoryEn: dto.dermalStoryEn || '',
      dermalStoryBn: dto.dermalStoryBn || '',
      keyActives: dto.keyActives || [],
      fullInci: dto.fullInci || '',
      usageSteps: dto.usageSteps || [],
      state: dto.publicationState || dto.state || 'PUBLISHED',
      publicationState: dto.publicationState || dto.state || 'PUBLISHED',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Metadata payload stored in PostgreSQL dermalProtocolEn column
    const metadataString = JSON.stringify({
      brand: newProduct.brand,
      imageUrl: newProduct.imageUrl,
      images: newProduct.images,
      routineStep: newProduct.routineStep,
      routinePeriod: newProduct.routinePeriod,
      originCountry: newProduct.originCountry,
      isPregnancySafe: newProduct.isPregnancySafe,
      purposeTagEn: newProduct.purposeTagEn,
      purposeTagBn: newProduct.purposeTagBn,
      dermalStoryEn: newProduct.dermalStoryEn,
      dermalStoryBn: newProduct.dermalStoryBn,
      keyActives: newProduct.keyActives,
      fullInci: newProduct.fullInci,
      usageSteps: newProduct.usageSteps,
    });

    // 3. Primary Persistence: Save directly to Supabase PostgreSQL via Prisma
    try {
      let catId: string | undefined;
      if (categoryName) {
        const matchingCat = await this.prisma.category.findFirst({
          where: {
            OR: [
              { nameEn: { equals: categoryName, mode: 'insensitive' } },
              { slug: { equals: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } },
            ],
          },
        }).catch(() => null);
        catId = matchingCat?.id;
      }
      if (!catId) {
        const defaultCat = await this.prisma.category.findFirst().catch(() => null);
        catId = defaultCat?.id;
      }

      const pubState = (dto.publicationState as PublicationState) || (dto.state as PublicationState) || PublicationState.PUBLISHED;

      const createdPrismaProduct = await this.prisma.product.upsert({
        where: { slug: newProduct.slug },
        update: {
          titleEn: newProduct.titleEn,
          titleBn: newProduct.titleBn,
          publicationState: pubState,
          categoryId: catId,
          dermalProtocolEn: metadataString,
        },
        create: {
          slug: newProduct.slug,
          categoryId: catId,
          titleEn: newProduct.titleEn,
          titleBn: newProduct.titleBn,
          shortDescriptionEn: dto.shortDescriptionEn || newProduct.titleEn,
          shortDescriptionBn: dto.shortDescriptionBn || newProduct.titleBn,
          dermalProtocolEn: metadataString,
          publicationState: pubState,
          variants: {
            create: variants.map((v) => ({
              sku: v.sku,
              volumeMlG: parseFloat(v.volume) || 50,
              priceBdt: v.priceBdt,
              cogsBdt: Math.round(Number(v.priceBdt || 2450) * 0.45),
              isActive: true,
            })),
          },
        },
      }).catch((e: any) => {
        this.logger.warn(`[Prisma Product Create Notice] ${e?.message || e}`);
      });

      if (createdPrismaProduct) {
        newProduct.id = createdPrismaProduct.id;
        this.logger.log(`[Supabase PostgreSQL] Product "${newProduct.titleEn}" saved successfully with ID: ${newProduct.id}!`);
      }
    } catch (err: any) {
      this.logger.warn(`[Prisma Product Sync Error] ${err?.message || err}`);
    }

    // 4. Invalidate Redis distributed cache immediately for zero-downtime updates
    await Promise.all([
      this.invalidateProductCaches(newProduct.slug),
      this.redis.del(this.CACHE_CATEGORIES_ALL),
    ]).catch(() => {});

    return newProduct;
  }

  async updateProduct(productIdOrSlug: string, dto: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

    const existing = await this.prisma.product.findFirst({
      where: isUuid ? { id: productIdOrSlug } : { slug: productIdOrSlug },
      include: { variants: true },
    });

    if (!existing) {
      throw new NotFoundException(`Product with identifier "${productIdOrSlug}" not found`);
    }

    let existingMeta: any = {};
    if (existing.dermalProtocolEn) {
      try {
        existingMeta = JSON.parse(existing.dermalProtocolEn);
      } catch {}
    }

    const updatedMeta = {
      ...existingMeta,
      brand: dto.brand !== undefined ? String(dto.brand).trim() : existingMeta.brand || 'Curated Formulation',
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : existingMeta.imageUrl || '',
      images: Array.isArray(dto.images) && dto.images.length > 0 ? dto.images : existingMeta.images || [],
      volume: dto.volume !== undefined ? dto.volume : existingMeta.volume || '',
      routineStep: dto.routineStep !== undefined ? dto.routineStep : existingMeta.routineStep,
      routinePeriod: dto.routinePeriod !== undefined ? dto.routinePeriod : existingMeta.routinePeriod,
      originCountry: dto.originCountry !== undefined ? dto.originCountry : existingMeta.originCountry,
      isPregnancySafe: dto.isPregnancySafe !== undefined ? dto.isPregnancySafe : existingMeta.isPregnancySafe,
      purposeTagEn: dto.purposeTagEn !== undefined ? dto.purposeTagEn : existingMeta.purposeTagEn,
      purposeTagBn: dto.purposeTagBn !== undefined ? dto.purposeTagBn : existingMeta.purposeTagBn,
      dermalStoryEn: dto.dermalStoryEn !== undefined ? dto.dermalStoryEn : existingMeta.dermalStoryEn,
      dermalStoryBn: dto.dermalStoryBn !== undefined ? dto.dermalStoryBn : existingMeta.dermalStoryBn,
    };

    // 1. Sync variants in PostgreSQL if provided
    if (Array.isArray(dto.variants) && dto.variants.length > 0) {
      try {
        await this.prisma.productVariant.deleteMany({
          where: { productId: existing.id },
        });

        await this.prisma.productVariant.createMany({
          data: dto.variants.map((v: any, idx: number) => {
            const volNum = parseFloat(v.volume) || parseFloat(v.volumeMlG) || null;
            return {
              productId: existing.id,
              sku: v.sku || `SYV-${existing.slug.toUpperCase().slice(0, 8)}-${String(v.volume || idx).replace(/[^a-zA-Z0-9]/g, '')}`,
              volumeMlG: volNum,
              priceBdt: Number(v.priceBdt) || 0,
              cogsBdt: Math.round((Number(v.priceBdt) || 0) * 0.45),
              isActive: true,
            };
          }),
        });
      } catch (err: any) {
        this.logger.warn(`[updateProduct Variant Sync Error] ${err?.message || err}`);
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(dto.titleEn ? { titleEn: dto.titleEn } : {}),
        ...(dto.titleBn ? { titleBn: dto.titleBn } : {}),
        ...(dto.shortDescriptionEn ? { shortDescriptionEn: dto.shortDescriptionEn } : {}),
        ...(dto.shortDescriptionBn ? { shortDescriptionBn: dto.shortDescriptionBn } : {}),
        ...(dto.state ? { publicationState: dto.state } : {}),
        dermalProtocolEn: JSON.stringify(updatedMeta),
      },
      include: {
        category: true,
        variants: true,
      },
    }).catch(() => null);

    // Invalidate Redis caches immediately for instant storefront reflection
    await Promise.all([
      this.invalidateProductCaches(existing.slug),
      this.redis.del(this.CACHE_PRODUCTS_ALL),
      this.redis.del(this.CACHE_CATEGORIES_ALL),
    ]).catch(() => {});

    return updated || { success: true };
  }

  async updatePublicationState(productId: string, targetState: PublicationState) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: productId } : { slug: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with identifier "${productId}" not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: { publicationState: targetState },
    });

    await this.invalidateProductCaches(product.slug);
    return updated;
  }

  async updateProductPrice(productIdOrSlug: string, dto: { priceBdt: number; compareAtPriceBdt?: number; sku?: string }) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: productIdOrSlug } : { slug: productIdOrSlug },
      include: { variants: true },
    });

    if (product && product.variants.length > 0) {
      const targetVariant = dto.sku
        ? product.variants.find((v) => v.sku === dto.sku) || product.variants[0]
        : product.variants[0];

      const updatedVariant = await this.prisma.productVariant.update({
        where: { id: targetVariant.id },
        data: {
          priceBdt: dto.priceBdt,
          ...(dto.compareAtPriceBdt !== undefined ? { compareAtPriceBdt: dto.compareAtPriceBdt } : {}),
        },
      });

      // Invalidate Redis caches
      await this.invalidateProductCaches(product.slug);

      return {
        success: true,
        productId: product.id,
        productSlug: product.slug,
        titleEn: product.titleEn,
        variantId: updatedVariant.id,
        sku: updatedVariant.sku,
        newPriceBdt: Number(updatedVariant.priceBdt),
        compareAtPriceBdt: updatedVariant.compareAtPriceBdt ? Number(updatedVariant.compareAtPriceBdt) : null,
      };
    }

    throw new NotFoundException(`Product with identifier "${productIdOrSlug}" not found`);
  }

  async deleteProduct(productIdOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);

    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: productIdOrSlug } : { slug: productIdOrSlug },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID or slug "${productIdOrSlug}" not found`);
    }

    // 1. Delete associated waitlists if any
    try {
      if (this.prisma.productWaitlist) {
        await this.prisma.productWaitlist.deleteMany({
          where: { productId: product.id },
        });
      }
    } catch {}

    // 2. Delete product variants
    try {
      if (this.prisma.productVariant) {
        await this.prisma.productVariant.deleteMany({
          where: { productId: product.id },
        });
      }
    } catch {}

    // 3. Delete product
    await this.prisma.product.delete({
      where: { id: product.id },
    });

    // 4. Invalidate all relevant caches
    await this.invalidateProductCaches(product.slug);

    return { success: true, message: `Product "${product.titleEn}" successfully deleted.` };
  }

  generatePreviewToken(productId: string): { token: string; expiresInMinutes: number } {
    const token = this.previewTokenService.generatePreviewToken(productId, 120);
    return { token, expiresInMinutes: 120 };
  }

  async getProductBySlug(slug: string, previewToken?: string) {
    const cacheKey = `${this.CACHE_PRODUCT_PREFIX}${slug}`;

    // 1. Check Redis cache (< 5ms response)
    if (!previewToken) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }

    // 2. Query Supabase PostgreSQL
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          include: {
            lots: {
              where: { status: LotStatus.ACTIVE },
            },
            bundleComponents: {
              include: {
                childVariant: {
                  include: {
                    lots: { where: { status: LotStatus.ACTIVE } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    if (product.publicationState !== PublicationState.PUBLISHED) {
      if (!previewToken) {
        throw new NotFoundException(`Product with slug "${slug}" not found or unpublished`);
      }
      const verifiedProductId = this.previewTokenService.verifyPreviewToken(previewToken);
      if (verifiedProductId !== product.id) {
        throw new BadRequestException('Preview token does not match this product');
      }
    }

    let meta: any = null;
    if (product.dermalProtocolEn) {
      try {
        meta = JSON.parse(product.dermalProtocolEn);
      } catch {}
    }

    const brand = meta?.brand || 'Curated Formulation';
    const imageUrl = meta?.imageUrl || (Array.isArray(meta?.images) ? meta.images[0] : '') || '';
    const images = Array.isArray(meta?.images) && meta.images.length > 0 ? meta.images : (imageUrl ? [imageUrl] : []);

    const variantsWithStock = product.variants.map((v: any, idx: number) => {
      const stock = this.computeCalculatedStock(v);
      const volNum = v.volumeMlG ? parseFloat(String(v.volumeMlG)) : null;
      const volStr = v.volume || (volNum ? `${volNum} ML` : (meta?.volume || ''));
      return {
        ...v,
        volume: volStr,
        titleEn: v.titleEn || volStr || `Edition ${idx + 1}`,
        titleBn: v.titleBn || volStr || `Edition ${idx + 1}`,
        priceBdt: Number(v.priceBdt) || 0,
        availableStock: stock,
        stockStatus: stock > 10 ? 'IN_STOCK' : stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      };
    });

    const result = {
      ...product,
      brand,
      imageUrl,
      images,
      keyActives: meta?.keyActives || [],
      fullInci: meta?.fullInci || '',
      usageSteps: meta?.usageSteps || [],
      routineStep: meta?.routineStep || 'Treat & Serum',
      purposeTagEn: meta?.purposeTagEn || 'CLINICAL CARE // NOURISH',
      purposeTagBn: meta?.purposeTagBn || 'ক্লিনিক্যাল ডার্মাল কেয়ার',
      variants: variantsWithStock,
    };

    // 3. Cache in Redis for 10 minutes (600s)
    if (!previewToken) {
      await this.redis.set(cacheKey, JSON.stringify(result), 600).catch(() => {});
    }

    return result;
  }

  // ---------------- Variant & Virtual Bundle Management ----------------
  async createVariant(dto: CreateVariantDto) {
    const existing = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new BadRequestException(`Variant with SKU "${dto.sku}" already exists`);
    }

    const isBundle = Boolean(dto.isBundle && dto.bundleComponents && dto.bundleComponents.length > 0);

    const variant = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdVariant = await tx.productVariant.create({
        data: {
          productId: dto.productId,
          sku: dto.sku,
          barcode: dto.barcode,
          volumeMlG: dto.volumeMlG,
          priceBdt: dto.priceBdt,
          compareAtPriceBdt: dto.compareAtPriceBdt,
          cogsBdt: dto.cogsBdt,
          weightGrams: dto.weightGrams || 250,
          isBundle,
        },
      });

      if (isBundle && dto.bundleComponents) {
        await tx.bundleItem.createMany({
          data: dto.bundleComponents.map((comp) => ({
            bundleVariantId: createdVariant.id,
            childVariantId: comp.childVariantId,
            quantity: comp.quantity,
          })),
        });
      }

      return createdVariant;
    });

    // Invalidate Redis caches
    await this.redis.del(this.CACHE_PRODUCTS_ALL).catch(() => {});
    await this.navigationService.invalidateCatalogCaches();
    return variant;
  }

  private computeCalculatedStock(variant: Record<string, unknown>): number {
    const bundleComponents = variant.bundleComponents as Array<{ quantity: number; childVariant?: { lots?: Array<{ availableQuantity: number; reservedQuantity: number }> } }> | undefined;
    
    if (variant.isBundle && bundleComponents && bundleComponents.length > 0) {
      const possibleCombos = bundleComponents.map((comp) => {
        const childLots = comp.childVariant?.lots || [];
        const childStock = childLots.reduce(
          (sum: number, lot) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
          0,
        );
        return Math.floor(childStock / comp.quantity);
      });
      return Math.min(...possibleCombos, 0);
    }

    const lots = (variant.lots as Array<{ availableQuantity: number; reservedQuantity: number }>) || [];
    return lots.reduce(
      (sum: number, lot) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
      0,
    );
  }
}
