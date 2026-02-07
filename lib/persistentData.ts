import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

export type Product = {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  createdBy?: string;
  createdAt?: string;
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number | null;
  aiReason?: string | null;
  imageQuality?: 'ok' | 'bad' | 'pending';
};

export type Review = {
  id: string;
  overallRating: number;
  attributes: {
    battery: number;
    durability: number;
    display: number;
    performance: number;
    camera: number;
    value: number;
    design: number;
  };
  notes?: string;
  source: string;
  reviewerName: string;
  reviewerEmail?: string;
  created_at: string;
  wouldRecommend?: boolean;
  authorClientId?: string;
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize products file if it doesn't exist
function initializeProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const initialProducts: Record<string, Product> = {
      "1": { id: "1", title: "Samsung Galaxy S10", brand: "Samsung", category: "Smartphones", priceMin_cents: 59999, priceMax_cents: 79999 },
      "2": { id: "2", title: "Dell XPS 13", brand: "Dell", category: "Laptops", priceMin_cents: 89999, priceMax_cents: 119999 },
      "3": { id: "3", title: "iPhone 15 Pro", brand: "Apple", category: "Phones", priceMin_cents: 99999, priceMax_cents: 119999 },
      "4": { id: "4", title: "Bose QuietComfort 45 Headphones", brand: "Bose", category: "Audio", priceMin_cents: 34999, priceMax_cents: 39999 },
      "5": { id: "5", title: "Samsung Galaxy Tab S9", brand: "Samsung", category: "Tablets", priceMin_cents: 69999, priceMax_cents: 89999 },
      "6": { id: "6", title: "Samsung 65-inch QLED TV", brand: "Samsung", category: "TVs", priceMin_cents: 149999, priceMax_cents: 199999 },
      "7": { id: "7", title: "OnePlus 12", brand: "OnePlus", category: "Smartphones", priceMin_cents: 64999, priceMax_cents: 84999 },
      "8": { id: "8", title: "MacBook Pro 14-inch M3", brand: "Apple", category: "Laptops", priceMin_cents: 169999, priceMax_cents: 219999 },
      "9": { id: "9", title: "LG 38-inch UltraWide Gaming Monitor", brand: "LG", category: "Monitors", priceMin_cents: 79999, priceMax_cents: 99999 },
      "10": { id: "10", title: "DJI Mini 4 Pro Drone", brand: "DJI", category: "Drones", priceMin_cents: 39999, priceMax_cents: 49999 },
      "user-1": { id: "user-1", title: "iPhone 16 Pro", brand: "Apple", category: "Phones", priceMin_cents: 99999, priceMax_cents: 119999 },
    };
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2));
  }
}

// Initialize reviews file if it doesn't exist (empty by default for new reviews to be added)
function initializeReviewsFile() {
  if (!fs.existsSync(REVIEWS_FILE)) {
    const initialReviews: Record<string, Review[]> = {};
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(initialReviews, null, 2));
  }
}

// Load products from file
export function loadProducts(): Record<string, Product> {
  initializeProductsFile();
  const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save products to file
export function saveProducts(products: Record<string, Product>) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Load reviews from file
export function loadReviews(): Record<string, Review[]> {
  initializeReviewsFile();
  const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save reviews to file
export function saveReviews(reviews: Record<string, Review[]>) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

// Get next user product ID
export function getNextProductId(products: Record<string, Product>): string {
  const userIds = Object.keys(products)
    .filter((id) => id.startsWith('user-'))
    .map((id) => Number(id.replace('user-', '')));

  const max = userIds.length > 0 ? Math.max(...userIds) : 0;
  return `user-${max + 1}`;
}
