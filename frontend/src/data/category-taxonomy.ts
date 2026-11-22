export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn?: string;
  children?: CategoryNode[];
}

export interface DepartmentNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn?: string;
  children: CategoryNode[];
}

/**
 * High-End Luxury Department Taxonomy:
 * Aligns with international beauty houses and reference standard (Ravissa).
 * Groups subcategories into elegant, scalable macro departments.
 */
export const LUXURY_DEPARTMENTS: Array<{
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  keywords: string[];
  defaultChildren: CategoryNode[];
}> = [
  {
    id: 'dept-skincare',
    slug: 'skincare',
    nameEn: 'SKIN CARE',
    nameBn: 'স্কিন কেয়ার',
    keywords: [
      'sun', 'sunscreen', 'suncream', 'sun stick', 'uv',
      'toner', 'essence', 'ampoule', 'serum',
      'pad', 'calming pad', 'peeling pad',
      'moisturizer', 'cream', 'gel cream', 'barrier',
      'cleanse', 'cleanser', 'foam', 'cleansing oil', 'cleansing balm', 'face wash',
      'mask', 'sheet mask', 'sleeping pack',
      'exfoliat', 'peel', 'scrub', 'aha', 'bha',
      'eye', 'eye cream', 'lip', 'lip balm',
      'skin', 'skincare',
    ],
    defaultChildren: [
      { id: 'cleanser', slug: 'cleanser', nameEn: 'Cleanser' },
      { id: 'toner', slug: 'toner', nameEn: 'Toner' },
      { id: 'ampoule', slug: 'ampoule', nameEn: 'Ampoule' },
      { id: 'essence', slug: 'essence', nameEn: 'Essence' },
      { id: 'serum', slug: 'serum', nameEn: 'Serum' },
      { id: 'moisturizer', slug: 'moisturizer', nameEn: 'Moisturizer' },
      { id: 'sunscreen', slug: 'sunscreen', nameEn: 'Sunscreen' },
      { id: 'pad', slug: 'pad', nameEn: 'Pad' },
    ],
  },
  {
    id: 'dept-bodycare',
    slug: 'body',
    nameEn: 'BODY CARE',
    nameBn: 'বডি কেয়ার',
    keywords: [
      'body', 'lotion', 'body lotion', 'milk',
      'body scrub', 'polish', 'body wash', 'shower',
      'shower gel', 'bath', 'hand', 'hand cream', 'foot',
    ],
    defaultChildren: [
      { id: 'body-lotion', slug: 'body-lotion', nameEn: 'Body Lotion' },
      { id: 'body-scrub', slug: 'body-scrub', nameEn: 'Body Scrub' },
      { id: 'shower-gel', slug: 'shower-gel', nameEn: 'Shower Gel' },
      { id: 'hand-foot', slug: 'hand-cream', nameEn: 'Hand & Foot Care' },
    ],
  },
  {
    id: 'dept-haircare',
    slug: 'hair',
    nameEn: 'HAIR CARE',
    nameBn: 'হেয়ার কেয়ার',
    keywords: [
      'hair', 'scalp', 'shampoo', 'conditioner', 'hair mask',
      'hair serum', 'hair oil', 'follicle',
    ],
    defaultChildren: [
      { id: 'scalp-care', slug: 'scalp-care', nameEn: 'Scalp Care' },
      { id: 'hair-oil-serum', slug: 'hair-serum', nameEn: 'Hair Serum & Oil' },
      { id: 'hair-mask', slug: 'hair-mask', nameEn: 'Hair Mask' },
    ],
  },
  {
    id: 'dept-makeup',
    slug: 'makeup',
    nameEn: 'MAKEUP',
    nameBn: 'মেকআপ',
    keywords: [
      'makeup', 'eyeliner', 'kajal', 'mascara',
      'lip tint', 'lipstick', 'tint', 'lip balm',
      'cushion', 'foundation', 'concealer', 'bb cream',
    ],
    defaultChildren: [
      { id: 'eyeliner', slug: 'eyeliner', nameEn: 'Eyeliner & Kajal' },
      { id: 'lip-tint', slug: 'lip-tint', nameEn: 'Lip Tint & Balm' },
    ],
  },
  {
    id: 'dept-babycare',
    slug: 'baby',
    nameEn: 'BABY CARE',
    nameBn: 'বেবি কেয়ার',
    keywords: ['baby', 'infant', 'toddler', 'kids', 'baby lotion', 'baby wash'],
    defaultChildren: [
      { id: 'baby-lotion', slug: 'baby-lotion', nameEn: 'Baby Lotion & Cream' },
      { id: 'baby-wash', slug: 'baby-wash', nameEn: 'Baby Wash & Shampoo' },
    ],
  },
  {
    id: 'dept-fragrance',
    slug: 'fragrance',
    nameEn: 'FRAGRANCE',
    nameBn: 'সুগন্ধি',
    keywords: ['fragrance', 'perfume', 'parfum', 'attar', 'mist', 'body mist', 'scent'],
    defaultChildren: [
      { id: 'body-mist', slug: 'body-mist', nameEn: 'Body Mist & Spray' },
      { id: 'perfume', slug: 'perfume', nameEn: 'Eau De Parfum' },
    ],
  },
  {
    id: 'dept-sets',
    slug: 'sets',
    nameEn: 'SETS & BUNDLES',
    nameBn: 'সেটস ও বান্ডেল',
    keywords: ['set', 'bundle', 'kit', 'combo', 'vault', 'routine', 'gift', 'complimentary'],
    defaultChildren: [
      { id: 'routine-sets', slug: 'routine-sets', nameEn: 'AM/PM Routine Sets' },
      { id: 'vip-gift-vault', slug: 'gift-vault', nameEn: 'VIP Gift Vault' },
    ],
  },
];

/**
 * Dynamic Department Builder:
 * Takes categories and products from the database, and intelligently
 * groups them into departments so the UI remains pristine, scalable,
 * and perfectly organized like Ravissa.
 */
export function buildDepartmentTaxonomy(
  dbCategories: Array<any> = [],
  dbProducts: Array<any> = [],
): CategoryNode[] {
  // Collect all distinct category items from both database categories table and live products
  const categoryMap = new Map<string, { slug: string; nameEn: string; nameBn?: string }>();

  // 1. Ingest database categories
  if (Array.isArray(dbCategories)) {
    dbCategories.forEach((c) => {
      if (!c) return;
      const slug = (c.slug || c.id || '').toLowerCase().trim();
      if (!slug) return;
      categoryMap.set(slug, {
        slug,
        nameEn: c.nameEn || c.slug,
        nameBn: c.nameBn,
      });
    });
  }

  // 2. Ingest products' categories
  if (Array.isArray(dbProducts)) {
    dbProducts.forEach((p) => {
      if (!p) return;
      const rawCat = p.category;
      const catName = typeof rawCat === 'object' && rawCat ? (rawCat.nameEn || rawCat.slug) : String(rawCat || '');
      const catSlug = typeof rawCat === 'object' && rawCat ? (rawCat.slug || rawCat.id) : catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (catName && catName !== 'Curated Formulation' && !categoryMap.has(catSlug.toLowerCase())) {
        categoryMap.set(catSlug.toLowerCase(), {
          slug: catSlug.toLowerCase(),
          nameEn: catName,
          nameBn: typeof rawCat === 'object' && rawCat?.nameBn ? rawCat.nameBn : catName,
        });
      }
    });
  }

  // Track which DB categories were claimed by departments
  const assignedCategories = new Set<string>();

  // Build the department tree
  const departments: CategoryNode[] = LUXURY_DEPARTMENTS.map((dept) => {
    const matchedChildren: CategoryNode[] = [];
    const childSlugs = new Set<string>();

    // Check every DB category against department keywords
    categoryMap.forEach((item, slug) => {
      const lowerName = item.nameEn.toLowerCase();
      const lowerSlug = slug.toLowerCase();

      const isMatch = dept.keywords.some((kw) => lowerName.includes(kw) || lowerSlug.includes(kw));
      if (isMatch) {
        assignedCategories.add(slug);
        if (!childSlugs.has(slug)) {
          childSlugs.add(slug);
          matchedChildren.push({
            id: `cat-${slug}`,
            slug: item.slug,
            nameEn: formatCategoryDisplayName(item.nameEn),
            nameBn: item.nameBn,
          });
        }
      }
    });

    // If no DB categories were matched for this department, fall back to pristine default subcategories
    const finalChildren = matchedChildren.length > 0 ? matchedChildren : dept.defaultChildren;

    return {
      id: dept.id,
      slug: dept.slug,
      nameEn: dept.nameEn,
      nameBn: dept.nameBn,
      children: finalChildren,
    };
  });

  // Any remaining DB categories that didn't match standard department keywords
  // will appear gracefully as their own top-level department rows
  categoryMap.forEach((item, slug) => {
    if (!assignedCategories.has(slug)) {
      departments.push({
        id: `custom-cat-${slug}`,
        slug: item.slug,
        nameEn: formatCategoryDisplayName(item.nameEn).toUpperCase(),
        nameBn: item.nameBn,
      });
    }
  });

  return departments;
}

/**
 * Formats all-caps or slugged category names into elegant Title Case (e.g., "SUNSCREEN" -> "Sunscreen")
 */
function formatCategoryDisplayName(name: string): string {
  if (!name) return '';
  // If already mixed case, keep it
  if (name !== name.toUpperCase() && name !== name.toLowerCase()) {
    return name;
  }
  // Convert "SUNSCREEN" -> "Sunscreen", "TONER & ESSENCE" -> "Toner & Essence"
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}
