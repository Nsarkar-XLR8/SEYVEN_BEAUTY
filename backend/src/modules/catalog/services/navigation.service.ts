import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { PublicationState } from '@prisma/client';

export interface MegaMenuItem {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  descriptionEn?: string;
  descriptionBn?: string;
  productCount?: number;
  icon?: string;
  children?: MegaMenuItem[];
}

export interface MegaMenuTree {
  categories: MegaMenuItem[];
  concerns: MegaMenuItem[];
  routines: MegaMenuItem[];
  formulations: MegaMenuItem[];
  activeIngredients: MegaMenuItem[];
  cachedAt: string;
}

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);
  private readonly CACHE_KEY = 'cache:navigation:mega_menu';
  private readonly CACHE_TTL_SECONDS = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Retrieves the comprehensive Mega-Menu hierarchical tree.
   * Leverages Redis caching for sub-millisecond response latency.
   */
  async getMegaMenu(): Promise<MegaMenuTree> {
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        this.logger.warn(`Failed to parse cached mega menu: ${(e as Error).message}`);
      }
    }

    // 1. Fetch Categories and their product counts with graceful offline fallback
    let categoryTree: MegaMenuItem[] = [];
    try {
      const rootCategories = await this.prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              _count: {
                select: {
                  products: {
                    where: { publicationState: PublicationState.PUBLISHED },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              products: {
                where: { publicationState: PublicationState.PUBLISHED },
              },
            },
          },
        },
        orderBy: { nameEn: 'asc' },
      });

      categoryTree = rootCategories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameBn: cat.nameBn,
        descriptionEn: cat.description || undefined,
        productCount: cat._count.products,
        children: cat.children.map((child) => ({
          id: child.id,
          slug: child.slug,
          nameEn: child.nameEn,
          nameBn: child.nameBn,
          descriptionEn: child.description || undefined,
          productCount: child._count.products,
        })),
      }));
    } catch (err) {
      this.logger.warn(`Database unreachable for category mega-menu tree: ${(err as Error).message}`);
    }

    // 2. Curated Skin Concern Taxonomy Tree
    const concernTaxonomy: MegaMenuItem[] = [
      {
        id: 'barrier_repair',
        slug: 'barrier-repair',
        nameEn: 'Barrier Repair & Ceramides',
        nameBn: 'Barrier Repair & Ceramides',
        descriptionEn: 'Triple ceramide complexes, panthenol, and lipid barrier restoration',
        icon: 'shield-check',
      },
      {
        id: 'acne_blemishes',
        slug: 'acne-blemishes',
        nameEn: 'Acne & Blemish Clarifying',
        nameBn: 'Acne & Blemish Clarifying',
        descriptionEn: 'Salicylic acid BHA, tea tree, and calming zinc non-comedogenic formulas',
        icon: 'sparkles',
      },
      {
        id: 'hyperpigmentation',
        slug: 'hyperpigmentation',
        nameEn: 'Hyperpigmentation & Melasma',
        nameBn: 'Hyperpigmentation & Melasma',
        descriptionEn: 'Niacinamide, alpha arbutin, tranexamic acid, and licorice extract',
        icon: 'sun',
      },
      {
        id: 'anti_aging',
        slug: 'anti-aging',
        nameEn: 'Collagen & Anti-Aging',
        nameBn: 'Collagen & Anti-Aging',
        descriptionEn: 'Multi-peptide matrices, encapsulated retinol, and copper peptides',
        icon: 'clock',
      },
      {
        id: 'hydration',
        slug: 'hydration',
        nameEn: 'Deep Hydration & Plumping',
        nameBn: 'Deep Hydration & Plumping',
        descriptionEn: '8-form multi-molecular hyaluronic acid, polyglutamic acid, and beta-glucan',
        icon: 'droplet',
      },
      {
        id: 'sensitivity',
        slug: 'sensitivity',
        nameEn: 'Calming & Rosacea Sensitivity',
        nameBn: 'Calming & Rosacea Sensitivity',
        descriptionEn: 'Centella Asiatica, madecassoside, artemisia, and heartleaf soothing',
        icon: 'heart',
      },
    ];

    // 3. Regimen & Routine Taxonomy Tree
    const routineTaxonomy: MegaMenuItem[] = [
      {
        id: 'cleanser',
        slug: 'cleanser',
        nameEn: 'Phase 1: Gentle Cleansers',
        nameBn: 'Phase 1: Gentle Cleansers',
        descriptionEn: 'pH 5.5 balanced, sulfate-free gentle purifying cleansers and cleansing oils',
      },
      {
        id: 'toner',
        slug: 'toner',
        nameEn: 'Phase 2: Toners & Micro-Essences',
        nameBn: 'Phase 2: Toners & Micro-Essences',
        descriptionEn: 'Dermal hydration prep, balancing, and micro-exfoliating toners',
      },
      {
        id: 'serum',
        slug: 'serum',
        nameEn: 'Phase 3: Active Treatment Serums',
        nameBn: 'Phase 3: Active Treatment Serums',
        descriptionEn: 'Concentrated clinical actives, ampoules, and targeted dermal treatments',
      },
      {
        id: 'moisturizer',
        slug: 'moisturizer',
        nameEn: 'Phase 4: Lipid Barrier Moisturizers',
        nameBn: 'Phase 4: Lipid Barrier Moisturizers',
        descriptionEn: 'Occlusive barrier creams, lightweight water gels, and restorative lotions',
      },
      {
        id: 'sunscreen',
        slug: 'sunscreen',
        nameEn: 'Phase 5: Broad-Spectrum Sunscreens',
        nameBn: 'Phase 5: Broad-Spectrum Sunscreens',
        descriptionEn: 'SPF 50+ PA++++ invisible physical & hybrid mineral photoprotection',
      },
      {
        id: 'night_repair',
        slug: 'night-repair',
        nameEn: 'Phase 6: Overnight Regeneration',
        nameBn: 'Phase 6: Overnight Regeneration',
        descriptionEn: 'Overnight regenerative balms, peptide sleep masks, and lipid infusions',
      },
    ];

    // 4. Formulation & Texture Taxonomy
    const formulationTaxonomy: MegaMenuItem[] = [
      { id: 'water_gel', slug: 'water-gel', nameEn: 'Weightless Water Gel', nameBn: 'Weightless Water Gel' },
      { id: 'rich_cream', slug: 'rich-cream', nameEn: 'Barrier Rich Cream', nameBn: 'Barrier Rich Cream' },
      { id: 'milky_emulsion', slug: 'milky-emulsion', nameEn: 'Hydra-Milky Emulsion', nameBn: 'Hydra-Milky Emulsion' },
      { id: 'clinical_serum', slug: 'clinical-serum', nameEn: 'Concentrated Serum', nameBn: 'Concentrated Serum' },
      { id: 'soothing_balm', slug: 'soothing-balm', nameEn: 'Recovery Cica Balm', nameBn: 'Recovery Cica Balm' },
    ];

    // 5. Active Ingredients Highlights
    const activeIngredients: MegaMenuItem[] = [
      { id: 'centella', slug: 'centella-asiatica', nameEn: 'Centella Asiatica (Cica)', nameBn: 'Centella Asiatica (Cica)' },
      { id: 'niacinamide', slug: 'niacinamide', nameEn: 'Niacinamide (Vitamin B3)', nameBn: 'Niacinamide (Vitamin B3)' },
      { id: 'ceramides', slug: 'ceramides-np-ap-eop', nameEn: 'Ceramides NP / AP / EOP', nameBn: 'Ceramides NP / AP / EOP' },
      { id: 'hyaluronic_acid', slug: 'hyaluronic-acid', nameEn: 'Hyaluronic Acid Complex', nameBn: 'Hyaluronic Acid Complex' },
      { id: 'salicylic_acid', slug: 'salicylic-acid-bha', nameEn: 'Salicylic Acid (BHA)', nameBn: 'Salicylic Acid (BHA)' },
      { id: 'retinoid', slug: 'granactive-retinoid', nameEn: 'Encapsulated Retinoid', nameBn: 'Encapsulated Retinoid' },
    ];

    const result: MegaMenuTree = {
      categories: categoryTree,
      concerns: concernTaxonomy,
      routines: routineTaxonomy,
      formulations: formulationTaxonomy,
      activeIngredients,
      cachedAt: new Date().toISOString(),
    };

    // Cache in Redis
    await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL_SECONDS, JSON.stringify(result));
    return result;
  }

  /**
   * Invalidates navigation and facet caches upon catalog mutations
   */
  async invalidateCatalogCaches(): Promise<void> {
    await this.redis.del(this.CACHE_KEY);
    const facetKeys = await this.redis.keys('cache:catalog:facets*');
    if (facetKeys.length > 0) {
      await this.redis.del(...facetKeys);
    }
    this.logger.log('🧹 [Cache Invalidation] Cleared Mega-Menu and Facet Redis caches');
  }
}
