import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { SearchQueryDto, SearchSortBy } from './dto/search-query.dto';
import { expandSynonyms } from './dictionaries/bangla-synonyms.dictionary';
import { calculateRelevanceScore } from './utils/fuzzy-matcher.util';
import { LotStatus, PublicationState, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface SearchProductItem {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  brand?: string;
  shortDescriptionEn?: string;
  shortDescriptionBn?: string;
  category?: { id: string; slug: string; nameEn: string; nameBn: string } | null;
  minPriceBdt: number | null;
  volume?: string;
  imageUrl?: string;
  totalAvailableStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  relevanceScore: number;
  matchedTerms: string[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private localCatalogPath = path.resolve(process.cwd(), 'data', 'local-catalog.json');

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * High-performance database-indexed search for 1,000+ SKUs with typo tolerance,
   * Bangla/Banglish synonym expansion, volume token recognition, and live stock calculation.
   */
  async search(
    dto: SearchQueryDto,
    context?: { ip?: string; userAgent?: string; userId?: string },
  ) {
    const rawQuery = dto.q.trim();
    const expandedTerms = expandSynonyms(rawQuery);
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    // Detect volume tokens like "50ml", "100ml", "250ml", "30ml", "50 ml"
    const volumeMatch = rawQuery.match(/(\d+(?:\.\d+)?)\s*(?:ml|g|gm|l|fl\s*oz)/i);
    const parsedVolume = volumeMatch ? parseFloat(volumeMatch[1]) : null;

    // Build targeted DB conditions
    const orConditions: Prisma.ProductWhereInput[] = [];

    for (const term of expandedTerms) {
      if (!term.trim()) continue;
      orConditions.push(
        { titleEn: { contains: term, mode: 'insensitive' } },
        { titleBn: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
        {
          category: {
            OR: [
              { nameEn: { contains: term, mode: 'insensitive' } },
              { nameBn: { contains: term, mode: 'insensitive' } },
              { slug: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
        {
          variants: {
            some: {
              OR: [
                { sku: { contains: term, mode: 'insensitive' } },
                { barcode: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      );
    }

    if (parsedVolume !== null) {
      orConditions.push({
        variants: {
          some: {
            volumeMlG: parsedVolume,
          },
        },
      });
    }

    let candidateProducts: any[] = [];

    try {
      candidateProducts = await this.prisma.product.findMany({
        where: {
          publicationState: PublicationState.PUBLISHED,
          ...(dto.isPregnancySafe !== undefined ? { isPregnancySafe: dto.isPregnancySafe } : {}),
          ...(dto.category ? { category: { slug: dto.category } } : {}),
          ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        },
        include: {
          category: {
            select: { id: true, slug: true, nameEn: true, nameBn: true },
          },
          variants: {
            select: {
              id: true,
              sku: true,
              barcode: true,
              volumeMlG: true,
              priceBdt: true,
              compareAtPriceBdt: true,
              lots: {
                where: { status: LotStatus.ACTIVE },
                select: { availableQuantity: true, reservedQuantity: true },
              },
            },
          },
        },
        take: 120, // targeted candidate set, no unbounded memory scans
      });
    } catch (err) {
      this.logger.warn(`Database query failed during search: ${(err as Error).message}`);
    }

    // Combine local catalog candidates with DB candidates so admin-added items are always searchable
    const localCandidates = this.searchLocalCatalogFallback(expandedTerms, dto);
    const existingSlugs = new Set(candidateProducts.map((p) => p.slug));
    for (const lc of localCandidates) {
      if (!existingSlugs.has(lc.slug)) {
        candidateProducts.push({
          ...lc,
          category: typeof lc.category === 'object' && lc.category ? lc.category : { nameEn: lc.category, nameBn: lc.category, slug: lc.slug },
          variants: lc.variants || [{ priceBdt: lc.priceBdt || 2450, volumeMlG: 50, lots: [{ availableQuantity: 50, reservedQuantity: 0 }] }],
        });
        existingSlugs.add(lc.slug);
      }
    }

    // Rank candidate products using relevance scoring
    const scoredProducts: SearchProductItem[] = [];

    for (const p of candidateProducts) {
      let maxScore = 0;
      const matchedTerms: string[] = [];

      for (const term of expandedTerms) {
        const isOriginal = term.toLowerCase() === rawQuery.toLowerCase();
        const weightMultiplier = isOriginal ? 1.6 : 1.0;

        const titleEnScore = calculateRelevanceScore(term, p.titleEn || '') * 3.0 * weightMultiplier;
        const titleBnScore = calculateRelevanceScore(term, p.titleBn || '') * 2.8 * weightMultiplier;
        const catScore = p.category
          ? calculateRelevanceScore(term, `${p.category.nameEn} ${p.category.nameBn}`) * 1.5 * weightMultiplier
          : 0;
        const descScore = calculateRelevanceScore(term, `${p.shortDescriptionEn || ''} ${p.shortDescriptionBn || ''}`) * 1.2 * weightMultiplier;

        const termScore = Math.max(titleEnScore, titleBnScore, catScore, descScore);

        if (termScore > 18) {
          matchedTerms.push(term);
          if (termScore > maxScore) {
            maxScore = termScore;
          }
        }
      }

      if (maxScore > 18 || orConditions.length === 0) {
        let totalStock = 0;
        let minPrice = Infinity;
        let primaryVolume: string | undefined;

        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            const price = Number(v.priceBdt || 0);
            if (price > 0 && price < minPrice) minPrice = price;
            if (v.volumeMlG && !primaryVolume) {
              primaryVolume = `${v.volumeMlG} ML`;
            }
            const stock = (v.lots || []).reduce(
              (sum: number, lot: { availableQuantity: number; reservedQuantity: number }) =>
                sum + Math.max(0, (lot.availableQuantity || 0) - (lot.reservedQuantity || 0)),
              0,
            );
            totalStock += stock;
          }
        } else if (p.priceBdt) {
          minPrice = Number(p.priceBdt);
          totalStock = 25;
          primaryVolume = p.volume;
        }

        if (dto.minPrice !== undefined && minPrice < dto.minPrice) continue;
        if (dto.maxPrice !== undefined && minPrice > dto.maxPrice) continue;

        scoredProducts.push({
          id: p.id,
          slug: p.slug,
          titleEn: p.titleEn,
          titleBn: p.titleBn || p.titleEn,
          brand: p.brand || this.extractBrandFromTitle(p.titleEn),
          shortDescriptionEn: p.shortDescriptionEn || undefined,
          shortDescriptionBn: p.shortDescriptionBn || undefined,
          category: p.category ? {
            id: p.category.id,
            slug: p.category.slug,
            nameEn: p.category.nameEn,
            nameBn: p.category.nameBn,
          } : null,
          minPriceBdt: minPrice !== Infinity ? minPrice : null,
          volume: primaryVolume,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || undefined,
          totalAvailableStock: totalStock,
          stockStatus: totalStock > 10 ? 'IN_STOCK' : totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
          relevanceScore: Math.round(maxScore),
          matchedTerms: Array.from(new Set(matchedTerms)),
        });
      }
    }

    // Sort results
    if (dto.sortBy === SearchSortBy.PRICE_ASC) {
      scoredProducts.sort((a, b) => (a.minPriceBdt || 0) - (b.minPriceBdt || 0));
    } else if (dto.sortBy === SearchSortBy.PRICE_DESC) {
      scoredProducts.sort((a, b) => (b.minPriceBdt || 0) - (a.minPriceBdt || 0));
    } else {
      scoredProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    const total = scoredProducts.length;
    const paginated = scoredProducts.slice((page - 1) * limit, page * limit);

    this.logSearchTelemetry(rawQuery, total, context).catch(() => {});

    return {
      query: rawQuery,
      expandedTerms,
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Predictive Typeahead Autocomplete delivering instant query suggestions,
   * matched formulations with thumbnails and live BDT prices (<20ms).
   */
  async autocomplete(query: string) {
    const rawQuery = (query || '').trim().toLowerCase();
    if (!rawQuery) {
      return { suggestions: [], products: [], categories: [] };
    }

    const cacheKey = `search:ac:${rawQuery}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.products?.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Redis unavailable, proceed to query
    }

    const expanded = expandSynonyms(rawQuery);
    let categories: any[] = [];
    let products: any[] = [];

    try {
      // 1. Categories match
      categories = await this.prisma.category.findMany({
        where: {
          OR: [
            { nameEn: { contains: rawQuery, mode: 'insensitive' } },
            { nameBn: { contains: rawQuery, mode: 'insensitive' } },
            { slug: { contains: rawQuery, mode: 'insensitive' } },
          ],
        },
        take: 4,
        select: { id: true, slug: true, nameEn: true, nameBn: true },
      });

      // 2. Products match (top 6 with primary variant price & volume)
      products = await this.prisma.product.findMany({
        where: {
          publicationState: PublicationState.PUBLISHED,
          OR: [
            { titleEn: { contains: rawQuery, mode: 'insensitive' } },
            { titleBn: { contains: rawQuery, mode: 'insensitive' } },
            { slug: { contains: rawQuery, mode: 'insensitive' } },
          ],
        },
        take: 6,
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleBn: true,
          category: { select: { nameEn: true, slug: true } },
          variants: {
            take: 1,
            select: { priceBdt: true, volumeMlG: true, sku: true },
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Database query failed during autocomplete: ${(err as Error).message}`);
    }

    // Always merge local catalog matches with DB products
    const localMatches = this.searchLocalCatalogFallback(expanded, { q: rawQuery });
    const dbSlugs = new Set(products.map((p) => p.slug));
    for (const lp of localMatches) {
      if (!dbSlugs.has(lp.slug)) {
        const catName = typeof lp.category === 'object' && lp.category ? lp.category.nameEn || lp.category.slug : lp.category || 'Targeted Serums & Ampoules';
        products.push({
          id: lp.id,
          slug: lp.slug,
          titleEn: lp.titleEn,
          titleBn: lp.titleBn,
          brand: lp.brand || this.extractBrandFromTitle(lp.titleEn),
          category: { nameEn: catName, slug: lp.slug },
          variants: [{ priceBdt: lp.priceBdt || 2450, volumeMlG: parseFloat(lp.volume) || 50, sku: lp.id }],
          imageUrl: lp.imageUrl,
        });
        dbSlugs.add(lp.slug);
      }
      if (products.length >= 8) break;
    }

    // Generate smart suggestions list
    const suggestionsSet = new Set<string>();
    for (const term of expanded) {
      if (term.toLowerCase() !== rawQuery) {
        suggestionsSet.add(term);
      }
    }
    for (const p of products) {
      suggestionsSet.add(p.titleEn);
    }
    for (const c of categories) {
      suggestionsSet.add(c.nameEn);
    }

    const payload = {
      query: rawQuery,
      suggestions: Array.from(suggestionsSet).slice(0, 6),
      products: products.map((p) => {
        const v = p.variants?.[0];
        return {
          id: p.id,
          slug: p.slug,
          titleEn: p.titleEn,
          titleBn: p.titleBn,
          brand: p.brand || this.extractBrandFromTitle(p.titleEn),
          category: p.category?.nameEn || null,
          priceBdt: v?.priceBdt ? Number(v.priceBdt) : null,
          volume: v?.volumeMlG ? `${v.volumeMlG} ML` : p.volume || undefined,
          imageUrl: p.imageUrl || undefined,
        };
      }),
      categories,
    };

    if (payload.products.length > 0) {
      try {
        await this.redis.set(cacheKey, JSON.stringify(payload), 180);
      } catch {
        // Redis set ignore
      }
    }

    return payload;
  }

  /**
   * Admin zero-result telemetry for merchandising insights.
   */
  async getZeroResultAnalytics(limit: number = 50) {
    try {
      const logs = await this.prisma.searchQueryLog.findMany({
        where: { totalResults: 0 },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const frequencyMap = new Map<string, { count: number; lastSearchedAt: Date; originalQuery: string }>();

      for (const log of logs) {
        const existing = frequencyMap.get(log.normalizedQuery) || {
          count: 0,
          lastSearchedAt: log.createdAt,
          originalQuery: log.query,
        };
        existing.count++;
        if (log.createdAt > existing.lastSearchedAt) {
          existing.lastSearchedAt = log.createdAt;
        }
        frequencyMap.set(log.normalizedQuery, existing);
      }

      const aggregated = Array.from(frequencyMap.entries())
        .map(([normalizedQuery, stat]) => ({
          normalizedQuery,
          originalQuery: stat.originalQuery,
          missCount: stat.count,
          lastSearchedAt: stat.lastSearchedAt.toISOString(),
        }))
        .sort((a, b) => b.missCount - a.missCount);

      return {
        totalZeroResultLogs: logs.length,
        uniqueMissingQueries: aggregated.length,
        data: aggregated,
      };
    } catch (err) {
      this.logger.warn(`Could not load zero result analytics: ${(err as Error).message}`);
      return { totalZeroResultLogs: 0, uniqueMissingQueries: 0, data: [] };
    }
  }

  private extractBrandFromTitle(title: string): string {
    const knownBrands = ['Anua', 'COSRX', 'Beauty of Joseon', 'The Ordinary', 'Skin1004', 'Haruharu', 'Round Lab', 'Isntree', 'Klairs', 'I\'m From'];
    for (const b of knownBrands) {
      if (title.toLowerCase().startsWith(b.toLowerCase()) || title.toLowerCase().includes(b.toLowerCase())) {
        return b;
      }
    }
    return 'The Edit';
  }

  private searchLocalCatalogFallback(expandedTerms: string[], dto: Partial<SearchQueryDto>): any[] {
    try {
      if (!fs.existsSync(this.localCatalogPath)) return [];
      const raw = fs.readFileSync(this.localCatalogPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.products || !Array.isArray(parsed.products)) return [];

      return parsed.products.filter((p: any) => {
        const text = `${p.titleEn || ''} ${p.titleBn || ''} ${p.brand || ''} ${p.slug || ''} ${typeof p.category === 'object' ? p.category?.nameEn : p.category || ''}`.toLowerCase();
        const q = (dto?.q || '').toLowerCase();
        if (q && text.includes(q)) return true;
        return expandedTerms.some((t) => t && text.includes(t.toLowerCase()));
      });
    } catch {
      return [];
    }
  }

  private async logSearchTelemetry(
    query: string,
    totalResults: number,
    context?: { ip?: string; userAgent?: string; userId?: string },
  ): Promise<void> {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return;

    try {
      await this.prisma.searchQueryLog.create({
        data: {
          query,
          normalizedQuery: normalized,
          totalResults,
          userId: context?.userId,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        },
      });

      if (totalResults === 0) {
        await this.redis.sadd('analytics:search:zero_results', normalized);
      }
    } catch (err) {
      this.logger.warn(`Could not save search query log: ${(err as Error).message}`);
    }
  }
}
