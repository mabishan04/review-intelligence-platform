// lib/mockData.ts
// Shared data helpers wired to persistentData.ts

import {
  loadProducts,
  saveProducts,
  loadReviews,
  saveReviews,
  getNextProductId as getNextUserProductId,
  Product as PersistProduct,
  Review as PersistReview,
} from "./persistentData";

export type Product = PersistProduct;
export type Review = PersistReview;

// In-memory copies that mirror what's on disk.
// Because this module is loaded once per server process, they behave like a singleton.
let products: Record<string, Product> = loadProducts();
let reviewsByProduct: Record<string, Review[]> = loadReviews();

// Re-export for existing imports
export const mockProducts = products;
export const mockReviews = reviewsByProduct;

// Helper: average rating + count
export function getProductStats(productId: string) {
  const list = reviewsByProduct[productId] || [];
  const count = list.length;
  const avgRating =
    count > 0
      ? (
          list.reduce((sum, r) => sum + (r.overallRating || 0), 0) / count
        ).toFixed(1)
      : "0";

  return { avgRating, count };
}

// --- Product helpers for "List a Product" feature ---

function getNextProductId(): string {
  return getNextUserProductId(products);
}

export function createProduct(input: {
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
}): Product {
  const id = getNextProductId();

  const product: Product = {
    id,
    title: input.title.trim(),
    brand: input.brand ? input.brand.trim() : null,
    category: input.category.trim(),
    price_cents: input.price_cents,
  };

  products[id] = product;
  saveProducts(products);
  return product;
}

// Add a review and persist it
export function addReview(input: {
  productId: string;
  overallRating: number;
  attributes: Review["attributes"];
  notes?: string;
  source: string;
  reviewerName: string;
  reviewerEmail?: string;
  wouldRecommend?: boolean;
  authorClientId?: string;
}): Review {
  const {
    productId,
    overallRating,
    attributes,
    notes,
    source,
    reviewerName,
    reviewerEmail,
    wouldRecommend,
    authorClientId,
  } = input;

  // Always reload latest from disk in case another request changed it
  reviewsByProduct = loadReviews();

  const newReview: Review = {
    id: `${productId}-${Date.now()}`,
    overallRating,
    attributes,
    notes,
    source,
    reviewerName,
    reviewerEmail,
    created_at: new Date().toISOString(),
    wouldRecommend,
    authorClientId,
  };

  const list = reviewsByProduct[productId] || [];
  // Put newest first
  reviewsByProduct[productId] = [newReview, ...list];

  saveReviews(reviewsByProduct);

  return newReview;
}

// Convenience for catalog etc.
export function getAllProducts(): Product[] {
  return Object.values(products);
}
