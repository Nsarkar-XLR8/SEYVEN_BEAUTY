/**
 * Curated Bangla, Banglish, and Skin Concern Synonym Mapping Dictionary
 * Maps colloquial Bengali / Banglish terms to clinical dermal catalog search terms.
 */
export const BANGLA_SYNONYM_DICTIONARY: Record<string, string[]> = {
  // Acne & Blemishes
  bron: ['acne', 'salicylic', 'blemish', 'tea tree', 'zinc', 'clarifying'],
  'ব্রণ': ['acne', 'salicylic', 'blemish', 'tea tree', 'zinc', 'clarifying'],
  acne: ['acne', 'salicylic', 'blemish', 'tea tree', 'zinc', 'bron'],
  pimple: ['acne', 'blemish', 'salicylic', 'spot treatment'],
  pimples: ['acne', 'blemish', 'salicylic', 'spot treatment'],
  rash: ['soothing', 'calming', 'cica', 'centella', 'panthenol'],

  // Hyperpigmentation & Dark Spots
  daag: ['hyperpigmentation', 'dark spot', 'niacinamide', 'brightening', 'alpha arbutin', 'tranexamic'],
  'দাগ': ['hyperpigmentation', 'dark spot', 'niacinamide', 'brightening', 'alpha arbutin', 'tranexamic'],
  'কালো দাগ': ['hyperpigmentation', 'dark spot', 'melasma', 'niacinamide'],
  kalo: ['brightening', 'radiance', 'vitamin c', 'niacinamide'],
  chob: ['hyperpigmentation', 'dark spot', 'blemish'],
  mechta: ['melasma', 'hyperpigmentation', 'tranexamic acid', 'alpha arbutin'],
  'মেছতা': ['melasma', 'hyperpigmentation', 'tranexamic acid', 'alpha arbutin'],
  mesta: ['melasma', 'hyperpigmentation', 'tranexamic acid'],

  // Brightening & Radiance
  forsa: ['brightening', 'radiance', 'vitamin c', 'niacinamide', 'glow'],
  'ফর্সা': ['brightening', 'radiance', 'vitamin c', 'niacinamide', 'glow'],
  ujjol: ['brightening', 'radiance', 'glow', 'luminous'],
  'উজ্জ্বল': ['brightening', 'radiance', 'glow', 'luminous'],
  glow: ['brightening', 'radiance', 'vitamin c', 'hydrating', 'dewy'],

  // Skin Types & Textures
  teltele: ['oily', 'sebum control', 'pore refining', 'matte', 'gel', 'niacinamide'],
  'তৈলাক্ত': ['oily', 'sebum control', 'pore refining', 'matte', 'gel', 'niacinamide'],
  oily: ['sebum', 'matte', 'gel', 'salicylic', 'niacinamide', 'teltele'],
  shukno: ['dry', 'hydration', 'hyaluronic', 'ceramide', 'barrier cream', 'rich cream'],
  'শুষ্ক': ['dry', 'hydration', 'hyaluronic', 'ceramide', 'barrier cream', 'rich cream'],
  khoshkhoshe: ['dry', 'flaky', 'barrier repair', 'ceramide', 'moisturizer'],
  dry: ['hydration', 'hyaluronic', 'ceramides', 'nourishing', 'shukno'],
  sensitive: ['calming', 'soothing', 'cica', 'centella', 'fragrance free', 'hypoallergenic'],
  'সংবেদনশীল': ['calming', 'soothing', 'cica', 'centella', 'fragrance free', 'hypoallergenic'],

  // Anti-Aging & Wrinkles
  bolirekha: ['anti-aging', 'peptide', 'retinol', 'collagen', 'firming', 'wrinkle'],
  'বলিরেখা': ['anti-aging', 'peptide', 'retinol', 'collagen', 'firming', 'wrinkle'],
  bura: ['anti-aging', 'retinol', 'collagen', 'peptides'],
  wrinkle: ['anti-aging', 'peptides', 'retinol', 'collagen'],
  wrinkles: ['anti-aging', 'peptides', 'retinol', 'collagen'],

  // Redness, Irritation & Barrier Repair
  lalche: ['calming', 'soothing', 'cica', 'centella', 'rosacea', 'barrier repair'],
  'লালচে': ['calming', 'soothing', 'cica', 'centella', 'rosacea', 'barrier repair'],
  chulkani: ['calming', 'soothing', 'panthenol', 'cica'],
  'চুলকানি': ['calming', 'soothing', 'panthenol', 'cica'],
  barrier: ['barrier repair', 'ceramide', 'panthenol', 'lipid', 'restorative'],
  'ব্যারিয়ার': ['barrier repair', 'ceramide', 'panthenol', 'lipid', 'restorative'],
  cica: ['centella asiatica', 'soothing', 'calming', 'madecassoside', 'barrier repair'],

  // Daily Routine Steps
  facewash: ['cleanser', 'gentle cleanser', 'cleansing gel', 'foam'],
  'ফেসওয়াশ': ['cleanser', 'gentle cleanser', 'cleansing gel', 'foam'],
  cleaner: ['cleanser', 'wash', 'foam'],
  sabun: ['cleanser', 'bar', 'gentle wash'],
  'সাবান': ['cleanser', 'bar', 'gentle wash'],
  toner: ['toner', 'essence', 'balancing toner', 'prep'],
  'টোনার': ['toner', 'essence', 'balancing toner', 'prep'],
  serum: ['serum', 'ampoule', 'treatment serum', 'active'],
  'সিরাম': ['serum', 'ampoule', 'treatment serum', 'active'],
  cream: ['moisturizer', 'barrier cream', 'water gel', 'lotion'],
  'ক্রিম': ['moisturizer', 'barrier cream', 'water gel', 'lotion'],
  sunscreen: ['sunscreen', 'spf', 'uv protection', 'photoprotection', 'sunblock'],
  'সানস্ক্রিন': ['sunscreen', 'spf', 'uv protection', 'photoprotection', 'sunblock'],
  sunblock: ['sunscreen', 'spf', 'uv photoprotection'],
  rod: ['sunscreen', 'spf', 'uv shield'],
  'রোদ': ['sunscreen', 'spf', 'uv shield'],
};

/**
 * Expands an input query with curated Bangla/Banglish synonym keywords.
 */
export function expandSynonyms(inputQuery: string): string[] {
  const terms = inputQuery.toLowerCase().trim().split(/\s+/);
  const expanded = new Set<string>(terms);

  for (const term of terms) {
    const directSynonyms = BANGLA_SYNONYM_DICTIONARY[term];
    if (directSynonyms) {
      for (const syn of directSynonyms) {
        expanded.add(syn);
      }
    }
  }

  return Array.from(expanded);
}
