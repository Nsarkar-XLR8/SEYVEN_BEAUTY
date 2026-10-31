import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { FacetFilterDto } from '../dto/facet.dto';
import { TaxonomyQueryDto, TaxonomySortBy } from '../dto/taxonomy.dto';
import { LotStatus, Prisma, PublicationState } from '@prisma/client';

export interface FacetCountItem {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  count: number;
}

export interface FacetResponse {
  categories: FacetCountItem[];
  concerns: FacetCountItem[];
  routines: FacetCountItem[];
  priceBrackets: {
    under_1000: number;
    bdt_1000_2500: number;
    bdt_2500_5000: number;
    above_5000: number;
  };
  safety: {
    pregnancySafe: number;
    lactationSafe: number;
  };
  stock: {
    inStock: number;
    outOfStock: number;
  };
  totalProducts: number;
}

@Injectable()
export class FacetService {
  private readonly logger = new Logger(FacetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generates real-time dynamic aggregate facet counts across published catalog products.
   */
  async getFacets(filter?: FacetFilterDto): Promise<FacetResponse> {
    const where: Prisma.ProductWhereInput = {
      publicationState: PublicationState.PUBLISHED,
    };

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    } else if (filter?.categorySlug) {
      where.category = { slug: filter.categorySlug };
    }

    if (filter?.isPregnancySafe !== undefined) {
      where.isPregnancySafe = filter.isPregnancySafe;
    }

    if (filter?.isLactationSafe !== undefined) {
      where.isLactationSafe = filter.isLactationSafe;
    }

    // Fetch all matching published products with their variants, lots, and categories
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          include: {
            lots: { where: { status: LotStatus.ACTIVE } },
          },
        },
      },
    });

    // 1. Category Facet Counts
    const categoryMap = new Map<string, { nameEn: string; nameBn: string; slug: string; count: number }>();

    for (const p of products) {
      if (p.category) {
        const existing = categoryMap.get(p.category.id) || {
          nameEn: p.category.nameEn,
          nameBn: p.category.nameBn,
          slug: p.category.slug,
          count: 0,
        };
        existing.count++;
        categoryMap.set(p.category.id, existing);
      }
    }

    const categories: FacetCountItem[] = Array.from(categoryMap.entries()).map(([id, val]) => ({
      id,
      slug: val.slug,
      nameEn: val.nameEn,
      nameBn: val.nameBn,
      count: val.count,
    }));

    // 2. Skin Concern Facet Counts
    const concernDefinitions = [
      { id: 'barrier_repair', slug: 'barrier-repair', nameEn: 'Barrier Repair', nameBn: 'Barrier Repair', regex: /barrier|ceramide|panthenol|lipid/i },
      { id: 'acne_blemishes', slug: 'acne-blemishes', nameEn: 'Acne & Blemishes', nameBn: 'Acne & Blemishes', regex: /acne|blemish|salicylic|bha|tea tree|zinc/i },
      { id: 'hyperpigmentation', slug: 'hyperpigmentation', nameEn: 'Hyperpigmentation', nameBn: 'Hyperpigmentation', regex: /pigment|dark spot|melasma|arbutin|niacinamide|bright/i },
      { id: 'anti_aging', slug: 'anti-aging', nameEn: 'Anti-Aging', nameBn: 'Anti-Aging', regex: /aging|wrinkle|peptide|retinol|collagen/i },
      { id: 'hydration', slug: 'hydration', nameEn: 'Hydration', nameBn: 'Hydration', regex: /hydrat|hyaluronic|moist|water/i },
      { id: 'sensitivity', slug: 'sensitivity', nameEn: 'Sensitivity & Calming', nameBn: 'Sensitivity & Calming', regex: /calm|sensitiv|sooth|cica|centella|redness/i },
    ];

    const concerns: FacetCountItem[] = concernDefinitions.map((c) => {
      const count = products.filter((p) => {
        const textToMatch = `${p.titleEn} ${p.shortDescriptionEn || ''} ${p.dermalProtocolEn || ''}`;
        return c.regex.test(textToMatch);
      }).length;

      return {
        id: c.id,
        slug: c.slug,
        nameEn: c.nameEn,
        nameBn: c.nameBn,
        count,
      };
    });

    // 3. Routine Facet Counts
    const routineDefinitions = [
      { id: 'cleanser', slug: 'cleanser', nameEn: 'Cleanser', nameBn: 'Cleanser', regex: /cleanse|cleanser|wash|foam|oil cleanser/i },
      { id: 'toner', slug: 'toner', nameEn: 'Toner & Essence', nameBn: 'Toner & Essence', regex: /toner|essence|prep/i },
      { id: 'serum', slug: 'serum', nameEn: 'Serum & Ampoule', nameBn: 'Serum & Ampoule', regex: /serum|ampoule|treatment/i },
      { id: 'moisturizer', slug: 'moisturizer', nameEn: 'Moisturizer', nameBn: 'Moisturizer', regex: /moisturiz|cream|lotion|gel cream|emulsion/i },
      { id: 'sunscreen', slug: 'sunscreen', nameEn: 'Sunscreen & SPF', nameBn: 'Sunscreen & SPF', regex: /sunscreen|spf|sun|uv/i },
      { id: 'night_repair', slug: 'night-repair', nameEn: 'Night Repair', nameBn: 'Night Repair', regex: /night|sleep|overnight/i },
    ];

    const routines: FacetCountItem[] = routineDefinitions.map((r) => {
      const count = products.filter((p) => {
        const textToMatch = `${p.titleEn} ${p.shortDescriptionEn || ''} ${p.dermalProtocolEn || ''}`;
        return r.regex.test(textToMatch);
      }).length;

      return {
        id: r.id,
        slug: r.slug,
        nameEn: r.nameEn,
        nameBn: r.nameBn,
        count,
      };
    });

    // 4. Price Bracket Counts
    let under_1000 = 0;
    let bdt_1000_2500 = 0;
    let bdt_2500_5000 = 0;
    let above_5000 = 0;

    // 5. Stock & Safety Counts
    let pregnancySafeCount = 0;
    let lactationSafeCount = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      if (p.isPregnancySafe) pregnancySafeCount++;
      if (p.isLactationSafe) lactationSafeCount++;

      // Compute product-level stock and min price
      let totalProductStock = 0;
      let minProductPrice = Infinity;

      for (const v of p.variants) {
        const price = Number(v.priceBdt);
        if (price < minProductPrice) minProductPrice = price;

        const stock = (v.lots || []).reduce(
          (sum, lot) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
          0,
        );
        totalProductStock += stock;
      }

      if (totalProductStock > 0) {
        inStockCount++;
      } else {
        outOfStockCount++;
      }

      if (minProductPrice < 1000) {
        under_1000++;
      } else if (minProductPrice <= 2500) {
        bdt_1000_2500++;
      } else if (minProductPrice <= 5000) {
        bdt_2500_5000++;
      } else if (minProductPrice !== Infinity) {
        above_5000++;
      }
    }

    return {
      categories,
      concerns,
      routines,
      priceBrackets: {
        under_1000,
        bdt_1000_2500,
        bdt_2500_5000,
        above_5000,
      },
      safety: {
        pregnancySafe: pregnancySafeCount,
        lactationSafe: lactationSafeCount,
      },
      stock: {
        inStock: inStockCount,
        outOfStock: outOfStockCount,
      },
      totalProducts: products.length,
    };
  }

  /**
   * Concern-first, Routine-first, and Formulation-first Taxonomy Query Engine.
   */
  async queryTaxonomy(query: TaxonomyQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      publicationState: PublicationState.PUBLISHED,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    } else if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }

    if (query.isPregnancySafe !== undefined) {
      where.isPregnancySafe = query.isPregnancySafe;
    }

    if (query.isLactationSafe !== undefined) {
      where.isLactationSafe = query.isLactationSafe;
    }

    // Taxonomy keywords building
    const searchTerms: string[] = [];
    if (query.concern) searchTerms.push(query.concern);
    if (query.routine) searchTerms.push(query.routine);
    if (query.formulation) searchTerms.push(query.formulation);
    if (query.skinType) searchTerms.push(query.skinType);

    if (searchTerms.length > 0) {
      const orConditions: Prisma.ProductWhereInput[] = [];
      for (const term of searchTerms) {
        orConditions.push(
          { titleEn: { contains: term, mode: 'insensitive' } },
          { titleBn: { contains: term, mode: 'insensitive' } },
          { shortDescriptionEn: { contains: term, mode: 'insensitive' } },
          { dermalProtocolEn: { contains: term, mode: 'insensitive' } },
        );
      }
      where.OR = orConditions;
    }

    // Filter by Price range on variants
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          priceBdt: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        },
      };
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === TaxonomySortBy.TITLE_ASC) {
      orderBy = { titleEn: 'asc' };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          variants: {
            include: {
              lots: { where: { status: LotStatus.ACTIVE } },
            },
          },
        },
      }),
    ]);

    // Format products with live stock and min price
    const enrichedProducts = products.map((p) => {
      let totalStock = 0;
      let minPrice = Infinity;

      const formattedVariants = (p.variants || []).map((v) => {
        const stock = (v.lots || []).reduce(
          (sum: number, lot: any) => sum + Math.max(0, lot.availableQuantity - lot.reservedQuantity),
          0,
        );
        const price = Number(v.priceBdt);
        if (price < minPrice) minPrice = price;
        totalStock += stock;

        return {
          id: v.id,
          sku: v.sku,
          volumeMlG: v.volumeMlG,
          priceBdt: v.priceBdt,
          compareAtPriceBdt: v.compareAtPriceBdt,
          availableStock: stock,
          stockStatus: stock > 10 ? 'IN_STOCK' : stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
        };
      });

      return {
        id: p.id,
        slug: p.slug,
        titleEn: p.titleEn,
        titleBn: p.titleBn,
        shortDescriptionEn: p.shortDescriptionEn,
        shortDescriptionBn: p.shortDescriptionBn,
        isPregnancySafe: p.isPregnancySafe,
        isLactationSafe: p.isLactationSafe,
        category: p.category,
        minPriceBdt: minPrice !== Infinity ? minPrice : null,
        totalAvailableStock: totalStock,
        stockStatus: totalStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        variants: formattedVariants,
        keyIngredients: [],
      };
    });

    return {
      data: enrichedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
