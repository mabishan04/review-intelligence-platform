import { Product } from '@/lib/firestoreHelper';

// Normalize title to compare
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Very simple similarity using normalized titles + Levenshtein-like score
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  const longerLength = longer.length;
  if (longerLength === 0) return 1;

  const editDistance = (s1: string, s2: string): number => {
    const dp: number[][] = [];

    for (let i = 0; i <= s1.length; i++) {
      dp[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[s1.length][s2.length];
  };

  const dist = editDistance(longer, shorter);
  return (longerLength - dist) / longerLength; // 0–1
}

export type DuplicateMatch = {
  product: Product;
  similarity: number;
};

export function findSimilarProduct(
  title: string,
  brand?: string | null,
  category?: string | null,
  productsMap?: Record<string, Product>,
  threshold: number = 0.9
): DuplicateMatch | null {
  const targetTitle = normalizeTitle(title);

  let bestMatch: DuplicateMatch | null = null;

  // Use provided products map or default to empty
  const products = productsMap || {};

  for (const product of Object.values(products)) {
    const candidateTitle = normalizeTitle(product.title);

    const rawSimilarity = stringSimilarity(targetTitle, candidateTitle);

    const sameBrand =
      brand &&
      product.brand &&
      product.brand.toLowerCase() === brand.toLowerCase();
    const sameCategory =
      category &&
      product.category &&
      product.category.toLowerCase() === category.toLowerCase();

    let adjustedSimilarity = rawSimilarity;

    // Small positive boosts for matching brand/category
    if (sameBrand) adjustedSimilarity += 0.03;
    if (sameCategory) adjustedSimilarity += 0.02;

    // 🔑 IMPORTANT: Penalize different model numbers (e.g., 15 vs 16, Pro vs Pro Max)
    // Extract all numbers from both titles
    const numbersA = (targetTitle.match(/\d+/g) || []) as string[];
    const numbersB = (candidateTitle.match(/\d+/g) || []) as string[];
    
    // If there are numbers and they differ, penalize similarity
    if (numbersA.length > 0 && numbersB.length > 0) {
      const hasMatchingNumber = numbersA.some((num) => numbersB.includes(num));
      if (!hasMatchingNumber) {
        // Different model/generation numbers = significant difference
        adjustedSimilarity -= 0.25;
      }
    }

    if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
      bestMatch = { product, similarity: adjustedSimilarity };
    }
  }

  if (bestMatch && bestMatch.similarity >= threshold) {
    return bestMatch;
  }

  return null;
}
