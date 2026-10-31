export interface InciActive {
  name: string;
  concentration?: string;
  category: 'RETINOID' | 'AHA_BHA' | 'VITAMIN_C' | 'NIACINAMIDE' | 'HYDRATOR' | 'SOOTHING' | 'SUN_FILTER' | 'PEPTIDE';
  purposeEn: string;
  purposeBn: string;
  ewgScore: number;
}

export interface InciIngredient {
  inciName: string;
  commonNameEn: string;
  commonNameBn?: string;
  functionEn: string;
  ewgScore: number;
  comedogenic: number; // 0 to 5
}

export interface ProductVariant {
  id: string;
  sku: string;
  titleEn: string;
  titleBn: string;
  volume: string;
  priceBdt: number;
  compareAtPriceBdt?: number;
  inStock: boolean;
  stockCount: number;
}

export interface ProductUsageStep {
  step: number;
  titleEn: string;
  titleBn: string;
  instructionEn: string;
  instructionBn: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  brand: string;
  titleEn: string;
  titleBn: string;
  purposeTagEn: string;
  purposeTagBn: string;
  subtitleEn: string;
  subtitleBn: string;
  volume: string;
  priceBdt: number;
  compareAtPriceBdt?: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  availableStock: number;
  bstiLicense: string;
  originCountry: string;
  isPregnancySafe: boolean;
  isLactationSafe: boolean;
  paoMonths: number;
  phLevel?: string;
  skinTypes: string[];
  routineStep: 'Cleanse' | 'Tone' | 'Treat & Serum' | 'Moisturize' | 'Sun Defence';
  routinePeriod: 'AM' | 'PM' | 'AM & PM';
  routineTag: string;
  images: {
    url: string;
    alt: string;
    label: string;
  }[];
  shortDescriptionEn: string;
  shortDescriptionBn: string;
  dermalStoryEn: string;
  dermalStoryBn: string;
  keyActives: InciActive[];
  fullInci: InciIngredient[];
  usageSteps: ProductUsageStep[];
  patchTestGuideEn: string;
  patchTestGuideBn: string;
  storageGuidanceEn: string;
  storageGuidanceBn: string;
  category?: string;
  categoryId?: string;
  variants: ProductVariant[];
}

export const MASTER_PRODUCTS: ProductDetail[] = [];

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return MASTER_PRODUCTS.find((p) => p.slug === slug);
}

export function getAllProducts(): ProductDetail[] {
  return MASTER_PRODUCTS;
}

export function createDynamicProductDetail(raw: any): ProductDetail {
  const images = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images.map((img: string, idx: number) => ({
        url: img,
        alt: `${raw.titleEn || 'Formulation'} - View ${idx + 1}`,
        label: idx === 0 ? 'Primary Studio' : `Angle ${idx + 1}`,
      }))
    : [
        {
          url: raw.imageUrl || raw.images?.[0] || '',
          alt: raw.titleEn || 'Formulation',
          label: 'Primary Studio',
        },
      ];

  const vol = raw.volume || '';
  const rawBrand = (raw.brand || '').trim() || 'Curated Care';
  const categoryStr = typeof raw.category === 'object' && raw.category
    ? raw.category.nameEn || raw.category.slug || ''
    : String(raw.category || '');
  const catLower = categoryStr.toLowerCase();

  // Multi-size variants mapping - strictly dynamic (Supporting both ML and G)
  let variants: ProductVariant[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, idx: number) => {
      let volStr = v.volume;
      if (!volStr) {
        const volNum = v.volumeMlG ? parseFloat(String(v.volumeMlG)) : null;
        // Check unit from raw.volume or SKU
        const rawUnitMatch = vol ? String(vol).match(/\b(G|GM|GRAMS?|ML|L|OZ)\b/i) : null;
        let detectedUnit = rawUnitMatch ? rawUnitMatch[0].toUpperCase() : null;
        if (!detectedUnit && v.sku) {
          const skuMatch = String(v.sku).match(/(?:-|_|\b)(\d+(?:\.\d+)?)\s*(G|GM|ML|OZ)(?:-|_|\b)/i);
          if (skuMatch) detectedUnit = skuMatch[2].toUpperCase().startsWith('G') ? 'G' : skuMatch[2].toUpperCase();
        }
        if (!detectedUnit) {
          const title = String(raw.titleEn || '').toLowerCase();
          if (title.includes('stick') || title.includes('balm') || title.includes('bar ') || title.includes('powder')) {
            detectedUnit = 'G';
          }
        }
        if (!detectedUnit) detectedUnit = 'ML';
        volStr = volNum ? `${volNum} ${detectedUnit}` : (v.volumeMl ? `${v.volumeMl} ML` : vol || '');
      }
      const displayTitle = v.titleEn || volStr || (vol ? `${vol}` : `Edition ${idx + 1}`);
      return {
        id: v.id || `var-${raw.id || raw.slug}-${idx}`,
        sku: v.sku || `SYV-${(raw.slug || 'SKU').toUpperCase().slice(0, 8)}-${(volStr || String(idx)).replace(/[^a-zA-Z0-9]/g, '')}`,
        titleEn: displayTitle,
        titleBn: displayTitle,
        volume: volStr || vol,
        priceBdt: Number(v.priceBdt) || Number(raw.priceBdt) || 0,
        inStock: v.inStock ?? true,
        stockCount: v.stockCount ?? 25,
      };
    });
  } else {
    const singlePrice = Number(raw.priceBdt) || 0;
    const fallbackVol = vol || 'Standard Edition';
    variants = [
      {
        id: `var-${raw.id || raw.slug}`,
        sku: raw.sku || `SYV-${(raw.slug || 'SKU').toUpperCase().slice(0, 10)}`,
        titleEn: fallbackVol,
        titleBn: fallbackVol,
        volume: vol || variants[0]?.volume || '',
        priceBdt: singlePrice,
        inStock: true,
        stockCount: 25,
      },
    ];
  }

  const primaryPrice = variants[0]?.priceBdt || Number(raw.priceBdt) || 2450;

  const normalizeActiveCategory = (cat?: string): InciActive['category'] => {
    if (!cat) return 'HYDRATOR';
    const upper = cat.toUpperCase();
    if (upper.includes('SUN') || upper.includes('UV') || upper.includes('FILTER')) return 'SUN_FILTER';
    if (upper.includes('RETIN')) return 'RETINOID';
    if (upper.includes('AHA') || upper.includes('BHA') || upper.includes('SALICYLIC') || upper.includes('GLYCOLIC')) return 'AHA_BHA';
    if (upper.includes('VIT') || upper.includes('ASCORB')) return 'VITAMIN_C';
    if (upper.includes('NIACIN')) return 'NIACINAMIDE';
    if (upper.includes('SOOTH') || upper.includes('CICA') || upper.includes('CENTELLA') || upper.includes('ALOE')) return 'SOOTHING';
    if (upper.includes('PEPT')) return 'PEPTIDE';
    const allowed = ['RETINOID', 'AHA_BHA', 'VITAMIN_C', 'NIACINAMIDE', 'HYDRATOR', 'SOOTHING', 'SUN_FILTER', 'PEPTIDE'] as const;
    return (allowed as readonly string[]).includes(upper) ? (upper as InciActive['category']) : 'HYDRATOR';
  };

  // Key actives dynamic parsing
  let keyActives: InciActive[] = [];
  if (Array.isArray(raw.keyActives) && raw.keyActives.length > 0) {
    keyActives = raw.keyActives.map((a: any) => ({
      name: a.name || 'Hero Active',
      concentration: a.concentration || undefined,
      category: normalizeActiveCategory(a.category),
      purposeEn: a.purposeEn || 'Targeted dermal support & barrier replenishment',
      purposeBn: a.purposeBn || a.purposeEn || 'Targeted dermal support & barrier replenishment',
      ewgScore: a.ewgScore ?? 1,
    }));
  } else if (typeof raw.keyActives === 'string' && raw.keyActives.trim()) {
    keyActives = raw.keyActives.split(',').map((act: string) => ({
      name: act.trim(),
      category: normalizeActiveCategory(act),
      purposeEn: 'Targeted dermal support & clinical balance',
      purposeBn: 'Targeted dermal support & clinical balance',
      ewgScore: 1,
    }));
  } else {
    if (catLower.includes('sun') || catLower.includes('fluid')) {
      keyActives = [
        {
          name: 'Broad-Spectrum UV Filters',
          category: 'SUN_FILTER',
          purposeEn: 'Photostable UVA/UVB shield against sunburn, premature aging, and HEV blue light',
          purposeBn: 'Photostable UVA/UVB shield against sunburn, premature aging, and HEV blue light',
          ewgScore: 1,
        },
        {
          name: 'Niacinamide & Antioxidants',
          category: 'NIACINAMIDE',
          purposeEn: 'Soothes heat redness and guards against urban environmental stress',
          purposeBn: 'Soothes heat redness and guards against urban environmental stress',
          ewgScore: 1,
        },
      ];
    } else {
      keyActives = [
        {
          name: 'Dermal Active Matrix',
          category: 'HYDRATOR',
          purposeEn: 'Bio-compatible moisture binding and cellular lipid protection',
          purposeBn: 'Bio-compatible moisture binding and cellular lipid protection',
          ewgScore: 1,
        },
      ];
    }
  }

  // Full INCI parsing
  let fullInci: InciIngredient[] = [];
  if (Array.isArray(raw.fullInci) && raw.fullInci.length > 0) {
    fullInci = raw.fullInci.map((ing: any) => ({
      inciName: ing.inciName || ing.name || 'Active Component',
      commonNameEn: typeof ing.commonNameEn === 'string' && ing.commonNameEn ? ing.commonNameEn : (ing.inciName || ing.name || 'Active Element'),
      commonNameBn: typeof ing.commonNameBn === 'string' && ing.commonNameBn ? ing.commonNameBn : undefined,
      functionEn: ing.functionEn || 'Skin conditioning',
      ewgScore: typeof ing.ewgScore === 'number' ? ing.ewgScore : 1,
      comedogenic: typeof ing.comedogenic === 'number' ? ing.comedogenic : 0,
    }));
  } else if (typeof raw.fullInci === 'string' && raw.fullInci.trim()) {
    fullInci = raw.fullInci.split(',').map((item: string) => {
      const trimmed = item.trim();
      return {
        inciName: trimmed,
        commonNameEn: trimmed,
        functionEn: 'Skin Conditioning Agent',
        ewgScore: 1,
        comedogenic: 0,
      };
    });
  } else {
    fullInci = [
      { inciName: 'Aqua / Water', commonNameEn: 'Purified Water', commonNameBn: 'Purified Water', functionEn: 'Solvent Base', ewgScore: 1, comedogenic: 0 },
      { inciName: 'Glycerin', commonNameEn: 'Plant Glycerin', commonNameBn: 'Plant Glycerin', functionEn: 'Humectant', ewgScore: 1, comedogenic: 0 },
      { inciName: 'Butylene Glycol', commonNameEn: 'Hydration Carrier', commonNameBn: 'Hydration Carrier', functionEn: 'Penetration Aid', ewgScore: 1, comedogenic: 1 },
      { inciName: '1,2-Hexanediol', commonNameEn: 'Stabilizer', commonNameBn: 'Stabilizer', functionEn: 'Preservative Booster', ewgScore: 1, comedogenic: 0 },
    ];
  }

  // Usage steps parsing
  let usageSteps: Array<{ step: number; titleEn: string; titleBn: string; instructionEn: string; instructionBn: string }> = [];
  if (Array.isArray(raw.usageSteps) && raw.usageSteps.length > 0) {
    usageSteps = raw.usageSteps.map((s: any, idx: number) => ({
      step: s.step || idx + 1,
      titleEn: s.titleEn || `Application Step ${idx + 1}`,
      titleBn: s.titleBn || s.titleEn || `Application Step ${idx + 1}`,
      instructionEn: s.instructionEn || 'Apply evenly onto clean skin.',
      instructionBn: s.instructionBn || s.instructionEn || 'Apply evenly onto clean skin.',
    }));
  } else if (raw.howToUseEn || raw.howToUse) {
    const enText = raw.howToUseEn || raw.howToUse || '';
    const bnText = raw.howToUseBn || enText;
    usageSteps = [
      {
        step: 1,
        titleEn: 'Preparation & Dispense',
        titleBn: 'Preparation & Dispense',
        instructionEn: enText,
        instructionBn: bnText,
      },
    ];
  } else {
    usageSteps = [
      {
        step: 1,
        titleEn: 'Precision Dispense',
        titleBn: 'Precision Dispense',
        instructionEn: 'Dispense 2-3 drops or a dime-sized amount onto clean fingertips.',
        instructionBn: 'Dispense 2-3 drops or a dime-sized amount onto clean fingertips.',
      },
      {
        step: 2,
        titleEn: 'Gentle Press Application',
        titleBn: 'Gentle Press Application',
        instructionEn: 'Press gently across face and neck until fully absorbed. Do not rub vigorously.',
        instructionBn: 'Press gently across face and neck until fully absorbed. Do not rub vigorously.',
      },
    ];
  }

  const dermalStoryEn = raw.dermalStoryEn || raw.shortDescriptionEn || 'Formulated with clinically-studied bio-active agents to reinforce dermal matrix resilience and restore baseline epidermal equilibrium.';
  const dermalStoryBn = raw.dermalStoryBn || raw.shortDescriptionBn || dermalStoryEn;

  const routinePeriod: 'AM' | 'PM' | 'AM & PM' =
    raw.routinePeriod === 'AM' || raw.routinePeriod === 'AM Only'
      ? 'AM'
      : raw.routinePeriod === 'PM' || raw.routinePeriod === 'PM Only'
      ? 'PM'
      : 'AM & PM';

  const routineStep: 'Cleanse' | 'Tone' | 'Treat & Serum' | 'Moisturize' | 'Sun Defence' =
    raw.routineStep === 'Sun Defence' || raw.routineStep === 'Sun Protection'
      ? 'Sun Defence'
      : raw.routineStep === 'Cleanse'
      ? 'Cleanse'
      : raw.routineStep === 'Tone'
      ? 'Tone'
      : raw.routineStep === 'Moisturize'
      ? 'Moisturize'
      : catLower.includes('sun')
      ? 'Sun Defence'
      : catLower.includes('cleanse')
      ? 'Cleanse'
      : catLower.includes('ton')
      ? 'Tone'
      : catLower.includes('cream') || catLower.includes('moistur')
      ? 'Moisturize'
      : 'Treat & Serum';

  return {
    id: raw.id || `prod-${Date.now().toString(36)}`,
    slug: raw.slug,
    brand: rawBrand.toUpperCase(),
    titleEn: raw.titleEn || 'Curated Formulation',
    titleBn: raw.titleBn || raw.titleEn || 'Curated Formulation',
    purposeTagEn: raw.purposeTagEn || 'CLINICAL CARE // ACTIVE DERMAL FORMULATION',
    purposeTagBn: raw.purposeTagBn || raw.purposeTagEn || 'CLINICAL CARE // ACTIVE DERMAL FORMULATION',
    subtitleEn: raw.shortDescriptionEn || raw.dermalStoryEn || `Certified genuine formulation by ${rawBrand}. Direct batch verification.`,
    subtitleBn: raw.shortDescriptionBn || raw.dermalStoryBn || `Certified genuine formulation by ${rawBrand}. Direct batch verification.`,
    volume: vol || variants[0]?.volume || '',
    priceBdt: primaryPrice,
    stockStatus: 'IN_STOCK',
    availableStock: 35,
    bstiLicense: raw.bstiLicense || 'BSTI/CM/2026-REG-ACTIVE',
    originCountry: raw.originCountry || 'International Authenticity',
    isPregnancySafe: raw.isPregnancySafe ?? true,
    isLactationSafe: raw.isLactationSafe ?? true,
    paoMonths: 12,
    skinTypes: Array.isArray(raw.skinTypes) ? raw.skinTypes : ['All Skin Types', 'Sensitive Friendly'],
    routineStep,
    routinePeriod,
    routineTag: raw.routineTag || 'THE EDIT ESSENTIAL',
    images,
    shortDescriptionEn: raw.shortDescriptionEn || dermalStoryEn,
    shortDescriptionBn: raw.shortDescriptionBn || dermalStoryBn,
    dermalStoryEn,
    dermalStoryBn,
    keyActives,
    fullInci,
    usageSteps,
    patchTestGuideEn: raw.patchTestGuideEn || 'Apply a small amount to upper forearm or jawline. If irritation occurs within 24 hours, rinse thoroughly.',
    patchTestGuideBn: raw.patchTestGuideBn || raw.patchTestGuideEn || 'Apply a small amount to upper forearm or jawline. If irritation occurs within 24 hours, rinse thoroughly.',
    storageGuidanceEn: raw.storageGuidanceEn || 'Store in a cool, dry place away from direct sunlight.',
    storageGuidanceBn: raw.storageGuidanceBn || raw.storageGuidanceEn || 'Store in a cool, dry place away from direct sunlight.',
    category: typeof raw.category === 'object' && raw.category ? (raw.category.nameEn || raw.category.slug || '') : String(raw.category || categoryStr || ''),
    categoryId: raw.categoryId || (typeof raw.category === 'object' ? raw.category?.id : undefined),
    variants,
  };
}
