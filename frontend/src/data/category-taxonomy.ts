export interface SubCategoryItem {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  filterType?: 'category' | 'concern' | 'brand' | 'sort' | 'badge';
  filterValue: string;
  badge?: string;
}

export interface ParentCategoryItem {
  id: string;
  name: string;
  nameBn?: string;
  subtitle?: string;
  slug: string;
  filterType?: 'category' | 'concern' | 'brand';
  filterValue: string;
  badge?: string;
  subcategories: SubCategoryItem[];
}

export const SEYVEN_CATEGORY_TAXONOMY: ParentCategoryItem[] = [
  {
    id: 'skincare',
    name: 'Skincare Formulations',
    nameBn: 'স্কিনকেয়ার ফর্মুলেশন',
    subtitle: 'Clinical & Curated Facial Care',
    slug: 'skincare',
    filterType: 'category',
    filterValue: 'skincare',
    badge: 'Core',
    subcategories: [
      { id: 'all-skincare', name: 'View All Skincare Formulations', slug: 'skincare', filterType: 'category', filterValue: 'skincare' },
      { id: 'serums', name: 'Serums & Ampoules', slug: 'serums-ampoules', filterType: 'category', filterValue: 'serums', badge: 'Active' },
      { id: 'toners', name: 'Toners & Essences', slug: 'toners-essences', filterType: 'category', filterValue: 'toners' },
      { id: 'suncare', name: 'Sun Protection (SPF 50+)', slug: 'sun-care', filterType: 'category', filterValue: 'sunscreen', badge: 'Essential' },
      { id: 'cleansers', name: 'Cleansers & Balms', slug: 'cleansers', filterType: 'category', filterValue: 'cleansers' },
      { id: 'moisturizers', name: 'Moisturizers & Barrier Creams', slug: 'moisturizers', filterType: 'category', filterValue: 'moisturizers' },
      { id: 'lip-eye', name: 'Lip & Eye Contour Care', slug: 'lip-eye-care', filterType: 'category', filterValue: 'lip' },
      { id: 'exfoliators', name: 'Exfoliators & Peels (AHA/BHA)', slug: 'exfoliators', filterType: 'category', filterValue: 'exfoliator' },
      { id: 'masks', name: 'Sheet Masks & Sleeping Packs', slug: 'sheet-masks', filterType: 'category', filterValue: 'mask' },
    ],
  },
  {
    id: 'concerns',
    name: 'By Clinical Concern',
    nameBn: 'স্কিন কনসার্ন অনুযায়ী',
    subtitle: 'Targeted Active Dermatological Solutions',
    slug: 'clinical-concerns',
    filterType: 'concern',
    filterValue: 'all',
    subcategories: [
      { id: 'all-concerns', name: 'Explore All Concern Solutions', slug: 'all-concerns', filterType: 'category', filterValue: 'all' },
      { id: 'acne', name: 'Acne & Blemish Defense (Salicylic/Niacinamide)', slug: 'acne-blemish', filterType: 'concern', filterValue: 'acne' },
      { id: 'brightening', name: 'Hyperpigmentation & Glow (Vitamin C/Arbutin)', slug: 'brightening-glow', filterType: 'concern', filterValue: 'brightening', badge: 'Cult' },
      { id: 'barrier', name: 'Skin Barrier Repair & Calming (Ceramides/Cica)', slug: 'barrier-repair', filterType: 'concern', filterValue: 'barrier' },
      { id: 'anti-aging', name: 'Anti-Aging & Firming (Peptides/Retinol)', slug: 'anti-aging', filterType: 'concern', filterValue: 'anti-aging' },
      { id: 'pores', name: 'Pore Minimizing & Oil Balance', slug: 'pore-minimizing', filterType: 'concern', filterValue: 'pores' },
      { id: 'hydration', name: 'Deep Hydration for Parched Skin (Hyaluronic)', slug: 'hydration', filterType: 'concern', filterValue: 'hydration' },
    ],
  },
  {
    id: 'body-bath',
    name: 'Body & Bath Sanctuary',
    nameBn: 'বডি অ্যান্ড বাথ কেয়ার',
    subtitle: 'Exfoliating Body Scrubs & Barrier Lotions',
    slug: 'body-bath',
    filterType: 'category',
    filterValue: 'body',
    subcategories: [
      { id: 'all-body', name: 'View All Body Sanctuary', slug: 'body-bath', filterType: 'category', filterValue: 'body' },
      { id: 'body-lotions', name: 'Body Lotions & Dermal Milks', slug: 'body-lotions', filterType: 'category', filterValue: 'lotion' },
      { id: 'body-scrubs', name: 'Exfoliating Body Polishes & Scrubs', slug: 'body-scrubs', filterType: 'category', filterValue: 'scrub' },
      { id: 'body-washes', name: 'Nourishing Shower Gels & Cleansers', slug: 'shower-gels', filterType: 'category', filterValue: 'wash' },
      { id: 'hand-foot', name: 'Hand & Heel Repair Balms', slug: 'hand-foot-balms', filterType: 'category', filterValue: 'balm' },
    ],
  },
  {
    id: 'hair-scalp',
    name: 'Hair & Scalp Rituals',
    nameBn: 'হেয়ার ও স্ক্যাল্প কেয়ার',
    subtitle: 'Follicle Density & Peptide Scalp Scrubs',
    slug: 'hair-scalp',
    filterType: 'category',
    filterValue: 'hair',
    subcategories: [
      { id: 'all-hair', name: 'View All Hair & Scalp Rituals', slug: 'hair-scalp', filterType: 'category', filterValue: 'hair' },
      { id: 'scalp-scrubs', name: 'AHA Scalp Exfoliators & Scrubs', slug: 'scalp-scrubs', filterType: 'category', filterValue: 'scalp' },
      { id: 'growth-serums', name: 'Hair Growth & Density Peptide Serums', slug: 'growth-serums', filterType: 'category', filterValue: 'serum' },
      { id: 'hair-masks', name: 'Deep Conditioning Hair Masks', slug: 'hair-masks', filterType: 'category', filterValue: 'mask' },
    ],
  },
  {
    id: 'curated-brands',
    name: 'Curated Houses & Brands',
    nameBn: 'অফিশিয়াল ব্র্যান্ডস',
    subtitle: '100% Certified Direct Manufacturer Imports',
    slug: 'curated-brands',
    filterType: 'brand',
    filterValue: 'all',
    badge: 'Verified',
    subcategories: [
      { id: 'all-brands', name: 'Explore All Curated Houses', slug: 'all-brands', filterType: 'category', filterValue: 'all' },
      { id: 'wishcare', name: 'WishCare Clinical Formulations', slug: 'wishcare', filterType: 'brand', filterValue: 'WishCare', badge: 'Official' },
      { id: 'k-beauty', name: 'Curated K-Beauty Exclusives', slug: 'k-beauty', filterType: 'brand', filterValue: 'Curated K-Beauty' },
      { id: 'mars', name: 'MARS Beauty & Accessories', slug: 'mars', filterType: 'brand', filterValue: 'MARS' },
      { id: 'seyven-signature', name: 'SEYVEN Courtesy & Signature Editions', slug: 'seyven', filterType: 'brand', filterValue: 'SEYVEN' },
    ],
  },
  {
    id: 'sets-gifting',
    name: 'Ritual Sets & VIP Vault',
    nameBn: 'সেটস ও গিফটিং ভল্ট',
    subtitle: 'Multi-Step Synergistic Routine Sets',
    slug: 'sets-gifting',
    filterType: 'category',
    filterValue: 'sets',
    badge: 'Privilege',
    subcategories: [
      { id: 'all-sets', name: 'View All Curated Sets & Bundles', slug: 'sets-gifting', filterType: 'category', filterValue: 'sets' },
      { id: 'routine-combos', name: 'Synergistic AM/PM Routine Combos', slug: 'routine-combos', filterType: 'category', filterValue: 'combo' },
      { id: 'gwp-vault', name: 'VIP Courtesy Gifts with Purchase', slug: 'vip-vault', filterType: 'category', filterValue: 'gift' },
    ],
  },
];

export interface EditorialMenuLink {
  label: string;
  labelBn?: string;
  href: string;
  badge?: string;
  isAccent?: boolean;
}

export const SEYVEN_EDITORIAL_MENU: EditorialMenuLink[] = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP ALL FORMULATIONS', href: '/catalog', badge: 'Runway' },
  { label: 'NEW ARRIVALS & CURATIONS', href: '/catalog?badge=new', badge: 'New', isAccent: true },
  { label: 'CULT BESTSELLERS', href: '/catalog?sort=bestseller' },
  { label: 'THE DERMAL CONCIERGE', href: '/skin-concierge', badge: 'AI/Expert' },
  { label: 'ABOUT THE SANCTUARY', href: '/about' },
  { label: 'CLIENT CARE & AUTHENTICITY', href: '/care' },
  { label: 'TRACK MY CONSIGNMENT', href: '/customer/tracking' },
];

/**
 * Dynamically merges categories fetched from the live database
 * with SEYVEN's editorial taxonomy to guarantee zero blank states.
 */
export function mergeDynamicTaxonomy(
  dbCategories: Array<{ id: string; slug: string; nameEn: string; nameBn?: string }> = [],
): ParentCategoryItem[] {
  if (!dbCategories || dbCategories.length === 0) {
    return SEYVEN_CATEGORY_TAXONOMY;
  }

  // Clone taxonomy
  const cloned: ParentCategoryItem[] = JSON.parse(JSON.stringify(SEYVEN_CATEGORY_TAXONOMY));

  // Find skincare group to inject any novel admin categories
  const skincareGroup = cloned.find((c) => c.id === 'skincare');
  if (skincareGroup) {
    const existingSlugs = new Set(skincareGroup.subcategories.map((s) => s.filterValue.toLowerCase()));
    
    dbCategories.forEach((cat) => {
      const slugVal = (cat.slug || cat.id).toLowerCase();
      if (!existingSlugs.has(slugVal) && !existingSlugs.has(cat.nameEn.toLowerCase())) {
        existingSlugs.add(slugVal);
        skincareGroup.subcategories.push({
          id: `db-${cat.id}`,
          name: cat.nameEn,
          nameBn: cat.nameBn,
          slug: cat.slug || cat.id,
          filterType: 'category',
          filterValue: cat.slug || cat.id,
        });
      }
    });
  }

  return cloned;
}
