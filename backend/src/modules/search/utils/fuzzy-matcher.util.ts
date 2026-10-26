/**
 * Computes standard Levenshtein edit distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if query is within typo threshold (distance <= 2 for words >= 4 chars, distance <= 1 for words 3 chars)
 */
export function isTypoMatch(queryWord: string, targetWord: string): boolean {
  const q = queryWord.toLowerCase();
  const t = targetWord.toLowerCase();
  if (q === t) return true;
  if (Math.abs(q.length - t.length) > 2) return false;

  const maxDist = q.length >= 5 ? 2 : q.length >= 3 ? 1 : 0;
  return levenshteinDistance(q, t) <= maxDist;
}

/**
 * Generates trigrams for a given string
 */
export function generateTrigrams(text: string): Set<string> {
  const padded = `  ${text.toLowerCase()} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Computes Trigram (Dice coefficient) similarity score between 0.0 and 1.0
 */
export function trigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1.toLowerCase() === str2.toLowerCase()) return 1.0;

  const tri1 = generateTrigrams(str1);
  const tri2 = generateTrigrams(str2);

  let intersection = 0;
  for (const tri of tri1) {
    if (tri2.has(tri)) {
      intersection++;
    }
  }

  return (2.0 * intersection) / (tri1.size + tri2.size);
}

/**
 * Calculates a multi-factor search relevance score combining:
 * 1. Exact substring match
 * 2. Token overlap & prefix matching
 * 3. Typo-tolerant Levenshtein matches
 * 4. Trigram similarity
 */
export function calculateRelevanceScore(query: string, targetText: string): number {
  if (!query || !targetText) return 0;

  const q = query.toLowerCase().trim();
  const target = targetText.toLowerCase().trim();

  // Exact phrase match gives highest boost
  if (target === q) return 100;
  if (target.includes(q)) return 80 + Math.min(20, (q.length / target.length) * 20);

  const queryWords = q.split(/\s+/);
  const targetWords = target.split(/\s+/);

  let wordScore = 0;
  for (const qWord of queryWords) {
    let bestMatchForWord = 0;

    for (const tWord of targetWords) {
      if (tWord === qWord) {
        bestMatchForWord = Math.max(bestMatchForWord, 50);
      } else if (tWord.startsWith(qWord)) {
        bestMatchForWord = Math.max(bestMatchForWord, 35);
      } else if (isTypoMatch(qWord, tWord)) {
        bestMatchForWord = Math.max(bestMatchForWord, 25);
      } else {
        const triScore = trigramSimilarity(qWord, tWord);
        if (triScore > 0.6) {
          bestMatchForWord = Math.max(bestMatchForWord, triScore * 20);
        }
      }
    }
    wordScore += bestMatchForWord;
  }

  return wordScore / queryWords.length;
}
