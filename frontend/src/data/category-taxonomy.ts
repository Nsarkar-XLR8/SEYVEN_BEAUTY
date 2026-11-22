export interface CategoryNode {
  id: string;
  slug: string;
  nameEn: string;
  nameBn?: string;
  children?: CategoryNode[];
}

/**
 * Pristine, elegant default luxury category hierarchy for SEYVEN.
 * Used for instant, zero-delay rendering while live database categories load.
 */
export const DEFAULT_LUXURY_CATEGORIES: CategoryNode[] = [
  {
    id: 'skincare',
    slug: 'skincare',
    nameEn: 'SKIN CARE',
    nameBn: 'স্কিন কেয়ার',
    children: [
      { id: 'cleansers', slug: 'cleansers', nameEn: 'Cleansers & Balms', nameBn: 'ক্লিনজার' },
      { id: 'toners', slug: 'toners', nameEn: 'Toners & Essences', nameBn: 'টোনার ও এসেন্স' },
      { id: 'serums', slug: 'serums', nameEn: 'Serums & Ampoules', nameBn: 'সিরাম ও অ্যাম্পুল' },
      { id: 'moisturizers', slug: 'moisturizers', nameEn: 'Moisturizers & Creams', nameBn: 'ময়েশ্চারাইজার' },
      { id: 'sunscreen', slug: 'sunscreen', nameEn: 'Sun Protection (SPF)', nameBn: 'সানস্ক্রিন' },
      { id: 'lip-eye', slug: 'lip', nameEn: 'Lip & Eye Care', nameBn: 'লিপ ও আই কেয়ার' },
      { id: 'exfoliator', slug: 'exfoliator', nameEn: 'Exfoliators & Peels', nameBn: 'এক্সফোলিয়েটর' },
      { id: 'masks', slug: 'mask', nameEn: 'Face Masks & Packs', nameBn: 'মাস্ক' },
    ],
  },
  {
    id: 'body-bath',
    slug: 'body',
    nameEn: 'BODY CARE',
    nameBn: 'বডি কেয়ার',
    children: [
      { id: 'body-lotion', slug: 'lotion', nameEn: 'Body Lotions & Milks', nameBn: 'বডি লোশন' },
      { id: 'body-scrub', slug: 'scrub', nameEn: 'Body Scrubs & Polishes', nameBn: 'বডি স্ক্রাব' },
      { id: 'body-wash', slug: 'wash', nameEn: 'Shower Gels & Washes', nameBn: 'শাওয়ার জেল' },
      { id: 'hand-foot', slug: 'balm', nameEn: 'Hand & Foot Care', nameBn: 'হ্যান্ড ও ফুট কেয়ার' },
    ],
  },
  {
    id: 'hair-scalp',
    slug: 'hair',
    nameEn: 'HAIR CARE',
    nameBn: 'হেয়ার কেয়ার',
    children: [
      { id: 'scalp-care', slug: 'scalp', nameEn: 'Scalp Scrubs & Treatments', nameBn: 'স্ক্যাল্প কেয়ার' },
      { id: 'hair-serum', slug: 'hair-serum', nameEn: 'Hair Serums & Oils', nameBn: 'হেয়ার সিরাম' },
      { id: 'hair-mask', slug: 'hair-mask', nameEn: 'Deep Hair Masks', nameBn: 'হেয়ার মাস্ক' },
    ],
  },
  {
    id: 'makeup',
    slug: 'makeup',
    nameEn: 'MAKEUP',
    nameBn: 'মেকআপ',
    children: [
      { id: 'eye-makeup', slug: 'eyeliner', nameEn: 'Eyeliners & Kajal', nameBn: 'আইলাইনার' },
      { id: 'lip-makeup', slug: 'lip-tint', nameEn: 'Lip Balms & Tints', nameBn: 'লিপ টিন্ট' },
    ],
  },
  {
    id: 'sets-vault',
    slug: 'sets',
    nameEn: 'SETS & BUNDLES',
    nameBn: 'সেটস ও বান্ডেল',
    children: [
      { id: 'routine-combos', slug: 'combo', nameEn: 'AM/PM Routine Sets', nameBn: 'রুটিন কম্বো' },
      { id: 'gift-vault', slug: 'gift', nameEn: 'Complimentary VIP Gifts', nameBn: 'ভিআইপি গিফট' },
    ],
  },
];

/**
 * 100% Dynamic Category Resolver:
 * Ingests live database categories and live published products from Admin Portal,
 * building an accurate, self-healing hierarchical category tree.
 */
export function buildDynamicCategoryTree(
  dbCategories: Array<any> = [],
  dbProducts: Array<any> = [],
): CategoryNode[] {
  // If no DB data is available yet, return the default luxury taxonomy
  if ((!dbCategories || dbCategories.length === 0) && (!dbProducts || dbProducts.length === 0)) {
    return DEFAULT_LUXURY_CATEGORIES;
  }

  const result: CategoryNode[] = [];
  const processedSlugs = new Set<string>();

  // 1. Process root categories from database (where parentId is null or children exist)
  if (Array.isArray(dbCategories) && dbCategories.length > 0) {
    // If backend returns hierarchical categories (each root has a `children` array)
    const rootsWithChildren = dbCategories.filter((c) => c && (!c.parentId || (c.children && c.children.length > 0)));

    if (rootsWithChildren.length > 0) {
      rootsWithChildren.forEach((root) => {
        const rootSlug = (root.slug || root.id || '').toLowerCase();
        if (!rootSlug || processedSlugs.has(rootSlug)) return;
        processedSlugs.add(rootSlug);

        const children: CategoryNode[] = [];
        if (Array.isArray(root.children)) {
          root.children.forEach((child: any) => {
            const childSlug = (child.slug || child.id || '').toLowerCase();
            if (childSlug && !processedSlugs.has(childSlug)) {
              processedSlugs.add(childSlug);
              children.push({
                id: child.id || childSlug,
                slug: child.slug || childSlug,
                nameEn: child.nameEn || child.slug,
                nameBn: child.nameBn,
              });
            }
          });
        }

        result.push({
          id: root.id || rootSlug,
          slug: root.slug || rootSlug,
          nameEn: (root.nameEn || root.slug || '').toUpperCase(),
          nameBn: root.nameBn,
          children: children.length > 0 ? children : undefined,
        });
      });
    } else {
      // If categories from DB are flat list (e.g. from Admin Portal direct sync)
      dbCategories.forEach((cat) => {
        const slug = (cat.slug || cat.id || '').toLowerCase();
        if (!slug || processedSlugs.has(slug)) return;
        processedSlugs.add(slug);

        result.push({
          id: cat.id || slug,
          slug: cat.slug || slug,
          nameEn: (cat.nameEn || cat.slug || '').toUpperCase(),
          nameBn: cat.nameBn,
        });
      });
    }
  }

  // 2. Discover any additional categories present on live products that haven't been indexed
  if (Array.isArray(dbProducts) && dbProducts.length > 0) {
    dbProducts.forEach((p) => {
      if (!p) return;
      const rawCat = p.category;
      const catName = typeof rawCat === 'object' && rawCat ? (rawCat.nameEn || rawCat.slug) : String(rawCat || '');
      const catSlug = typeof rawCat === 'object' && rawCat ? (rawCat.slug || rawCat.id) : catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (catName && catName !== 'Curated Formulation' && !processedSlugs.has(catSlug.toLowerCase())) {
        processedSlugs.add(catSlug.toLowerCase());
        result.push({
          id: catSlug,
          slug: catSlug,
          nameEn: catName.toUpperCase(),
          nameBn: typeof rawCat === 'object' && rawCat?.nameBn ? rawCat.nameBn : catName,
        });
      }
    });
  }

  return result.length > 0 ? result : DEFAULT_LUXURY_CATEGORIES;
}
