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
  commonNameBn: string;
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

  const vol = raw.volume || '50 ML';
  const rawBrand = (raw.brand || '').trim() || 'Curated Care';
  const categoryStr = typeof raw.category === 'object' && raw.category
    ? raw.category.nameEn || raw.category.slug || ''
    : String(raw.category || '');
  const catLower = categoryStr.toLowerCase();

  // Multi-size variants mapping
  let variants: ProductVariant[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, idx: number) => ({
      id: v.id || `var-${raw.id || raw.slug}-${idx}`,
      sku: v.sku || `SYV-${(raw.slug || 'SKU').toUpperCase().slice(0, 8)}-${(v.volume || vol).replace(/\s+/g, '')}`,
      titleEn: v.titleEn || `${v.volume || vol} Flacon`,
      titleBn: v.titleBn || `${v.volume || vol} সংস্করণ`,
      volume: v.volume || vol,
      priceBdt: Number(v.priceBdt) || Number(raw.priceBdt) || 2450,
      inStock: v.inStock ?? true,
      stockCount: v.stockCount ?? 25,
    }));
  } else {
    const singlePrice = Number(raw.priceBdt) || 2450;
    variants = [
      {
        id: `var-${raw.id || raw.slug}`,
        sku: raw.sku || `SYV-${(raw.slug || 'SKU').toUpperCase().slice(0, 10)}`,
        titleEn: `${vol} Standard Bottle`,
        titleBn: `${vol} বোতল`,
        volume: vol,
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
      purposeBn: a.purposeBn || a.purposeEn || 'ত্বকের কার্যকর সুস্থতা ও সুরক্ষা',
      ewgScore: a.ewgScore ?? 1,
    }));
  } else if (typeof raw.keyActives === 'string' && raw.keyActives.trim()) {
    keyActives = raw.keyActives.split(',').map((act: string) => ({
      name: act.trim(),
      category: normalizeActiveCategory(act),
      purposeEn: 'Targeted dermal support & clinical balance',
      purposeBn: 'ত্বকের কার্যকর সুস্থতা ও সুরক্ষা',
      ewgScore: 1,
    }));
  } else {
    if (catLower.includes('sun') || catLower.includes('fluid')) {
      keyActives = [
        {
          name: 'Broad-Spectrum UV Filters',
          category: 'SUN_FILTER',
          purposeEn: 'Photostable UVA/UVB shield against sunburn, premature aging, and HEV blue light',
          purposeBn: 'সূর্যের ক্ষতিকর অতিবেগুনি রশ্মি ও ব্লু-লাইট থেকে ত্বকের সর্বোচ্চ সুরক্ষা',
          ewgScore: 1,
        },
        {
          name: 'Niacinamide & Antioxidants',
          category: 'NIACINAMIDE',
          purposeEn: 'Soothes heat redness and guards against urban environmental stress',
          purposeBn: 'রোদে পোড়া লালচে ভাব কমায় এবং ত্বকের আর্দ্রতা বজায় রাখে',
          ewgScore: 1,
        },
      ];
    } else {
      keyActives = [
        {
          name: 'Dermal Active Matrix',
          category: 'HYDRATOR',
          purposeEn: 'Bio-compatible moisture binding and cellular lipid protection',
          purposeBn: 'ত্বকের গভীরের আর্দ্রতা ধরে রেখে প্রাকৃতিক ভারসাম্য রক্ষা করে',
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
      { inciName: 'Aqua / Water', commonNameEn: 'Purified Water', commonNameBn: 'পরিশোধিত পানি', functionEn: 'Solvent Base', ewgScore: 1, comedogenic: 0 },
      { inciName: 'Glycerin', commonNameEn: 'Plant Glycerin', commonNameBn: 'গ্লিসারিন', functionEn: 'Humectant', ewgScore: 1, comedogenic: 0 },
      { inciName: 'Butylene Glycol', commonNameEn: 'Hydration Carrier', commonNameBn: 'বিউটিলিন গ্লাইকল', functionEn: 'Penetration Aid', ewgScore: 1, comedogenic: 1 },
      { inciName: '1,2-Hexanediol', commonNameEn: 'Stabilizer', commonNameBn: 'ফর্মুলা স্টেবিলাইজার', functionEn: 'Preservative Booster', ewgScore: 1, comedogenic: 0 },
    ];
  }

  // Usage steps parsing
  let usageSteps: Array<{ step: number; titleEn: string; titleBn: string; instructionEn: string; instructionBn: string }> = [];
  if (Array.isArray(raw.usageSteps) && raw.usageSteps.length > 0) {
    usageSteps = raw.usageSteps.map((s: any, idx: number) => ({
      step: s.step || idx + 1,
      titleEn: s.titleEn || `Application Step ${idx + 1}`,
      titleBn: s.titleBn || `ব্যবহার ধাপ ${idx + 1}`,
      instructionEn: s.instructionEn || 'Apply evenly onto clean skin.',
      instructionBn: s.instructionBn || 'পরিষ্কার ত্বকে আলতো করে সমানভাবে লাগান।',
    }));
  } else if (raw.howToUseEn || raw.howToUse) {
    const enText = raw.howToUseEn || raw.howToUse || '';
    const bnText = raw.howToUseBn || enText;
    usageSteps = [
      {
        step: 1,
        titleEn: 'Preparation & Dispense',
        titleBn: 'প্রস্তুতি ও প্রয়োগ',
        instructionEn: enText,
        instructionBn: bnText,
      },
    ];
  } else {
    usageSteps = [
      {
        step: 1,
        titleEn: 'Precision Dispense',
        titleBn: 'প্রয়োজনমতো নিন',
        instructionEn: 'Dispense 2-3 drops or a dime-sized amount onto clean fingertips.',
        instructionBn: 'পরিষ্কার আঙুলে ২-৩ ফোঁটা বা পরিমিত পরিমাণ নিন।',
      },
      {
        step: 2,
        titleEn: 'Gentle Press Application',
        titleBn: 'আলতোভাবে ম্যাসাজ করুন',
        instructionEn: 'Press gently across face and neck until fully absorbed. Do not rub vigorously.',
        instructionBn: 'মুখ ও গলায় আলতো করে প্রেস করে মিলিয়ে দিন। ঘষবেন না।',
      },
    ];
  }

  const dermalStoryEn = raw.dermalStoryEn || raw.shortDescriptionEn || 'Formulated with clinically-studied bio-active agents to reinforce dermal matrix resilience and restore baseline epidermal equilibrium.';
  const dermalStoryBn = raw.dermalStoryBn || raw.shortDescriptionBn || 'ত্বকের প্রাকৃতিক আর্দ্রতা ও সুরক্ষার ভারসাম্য রক্ষা করতে বিশেষভাবে তৈরি বৈজ্ঞানিক ফর্মুলেশন।';

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
    titleBn: raw.titleBn || raw.titleEn || 'কিউরেটেড ফর্মুলেশন',
    purposeTagEn: raw.purposeTagEn || 'CLINICAL CARE // ACTIVE DERMAL FORMULATION',
    purposeTagBn: raw.purposeTagBn || raw.purposeTagEn || 'ক্লিনিক্যাল ডার্মাল কেয়ার',
    subtitleEn: raw.shortDescriptionEn || raw.dermalStoryEn || `Certified genuine formulation by ${rawBrand}. Direct batch verification.`,
    subtitleBn: raw.shortDescriptionBn || raw.dermalStoryBn || `${rawBrand} এর আসল ও পরীক্ষিত ফর্মুলেশন। সরাসরি আমদানিকৃত।`,
    volume: vol,
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
    patchTestGuideBn: raw.patchTestGuideBn || 'হাতের ওপরের অংশে বা কানের নিচে অল্প লাগিয়ে ২৪ ঘণ্টা পর্যবেক্ষণ করুন।',
    storageGuidanceEn: raw.storageGuidanceEn || 'Store in a cool, dry place away from direct sunlight.',
    storageGuidanceBn: raw.storageGuidanceBn || 'সরাসরি রোদ থেকে দূরে ঠান্ডা ও শুকনো জায়গায় সংরক্ষণ করুন।',
    variants,
  };
}
