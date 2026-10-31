/**
 * Search Synonym Dictionary (English-only Luxury Standard)
 */
export const BANGLA_SYNONYM_DICTIONARY: Record<string, string[]> = {};

/**
 * Standard token expansion (English direct tokenization)
 */
export function expandSynonyms(inputQuery: string): string[] {
  const terms = inputQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return Array.from(new Set(terms));
}
