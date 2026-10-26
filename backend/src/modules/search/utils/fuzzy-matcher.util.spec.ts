import {
  calculateRelevanceScore,
  isTypoMatch,
  levenshteinDistance,
  trigramSimilarity,
} from './fuzzy-matcher.util';

describe('FuzzyMatcherUtil', () => {
  it('should compute exact Levenshtein distance', () => {
    expect(levenshteinDistance('ceramide', 'ceramide')).toBe(0);
    expect(levenshteinDistance('niacinamide', 'nacinamide')).toBe(1);
    expect(levenshteinDistance('retinol', 'retnol')).toBe(1);
    expect(levenshteinDistance('serum', 'cream')).toBe(4);
  });

  it('should detect typo matches within tolerance', () => {
    expect(isTypoMatch('nacinamide', 'niacinamide')).toBe(true);
    expect(isTypoMatch('hyalronic', 'hyaluronic')).toBe(true);
    expect(isTypoMatch('cenella', 'centella')).toBe(true);
    expect(isTypoMatch('sunscreen', 'cleanser')).toBe(false);
  });

  it('should calculate trigram similarity scores', () => {
    const simHigh = trigramSimilarity('salicylic', 'salicylic acid');
    expect(simHigh).toBeGreaterThan(0.6);

    const simLow = trigramSimilarity('retinol', 'moisturizer');
    expect(simLow).toBeLessThan(0.3);
  });

  it('should calculate weighted relevance scores', () => {
    // Exact match
    const exactScore = calculateRelevanceScore('ceramide', 'ceramide');
    expect(exactScore).toBe(100);

    // Substring match
    const subScore = calculateRelevanceScore('ceramide', 'Triple Ceramide Barrier Cream');
    expect(subScore).toBeGreaterThan(80);

    // Typo match
    const typoScore = calculateRelevanceScore('nacinamide', 'Niacinamide 10% Serum');
    expect(typoScore).toBeGreaterThan(20);

    // Unrelated text
    const lowScore = calculateRelevanceScore('retinol', 'Gentle Water Hydrating Cleanser');
    expect(lowScore).toBeLessThan(20);
  });
});
