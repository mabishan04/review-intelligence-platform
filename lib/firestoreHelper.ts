import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { loadProducts, saveProducts, getNextProductId, loadReviews } from './persistentData';

// Helper: timeout wrapper to prevent Firestore hangs (3 second timeout)
function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Initialize Firebase (reuse existing config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export type Product = {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  createdBy: string; // "system" for seed data, or user ID
  createdAt: string;
  // AI-generated image and verification fields
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number | null; // 0-100
  aiReason?: string | null;
  imageQuality?: 'ok' | 'bad' | 'pending';
};

export type Review = {
  id: string;
  productId: string;
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

// --- Products ---

export async function getAllProducts(): Promise<Product[]> {
  console.log('[getAllProducts] Starting...');
  
  // Map to merge Firestore + local products (avoiding duplicates by ID)
  const productsMap = new Map<string, Product>();
  
  // 1. Always try to get local products first (seed data)
  try {
    const localProducts = loadProducts();
    Object.entries(localProducts).forEach(([id, p]) => {
      // Handle migration: if old products have price_cents, use as both min and max
      const priceMin = (p as any).priceMin_cents !== undefined ? (p as any).priceMin_cents : (p as any).price_cents;
      const priceMax = (p as any).priceMax_cents !== undefined ? (p as any).priceMax_cents : (p as any).price_cents;
      
      productsMap.set(id, {
        id: p.id,
        title: p.title,
        brand: p.brand,
        category: p.category,
        priceMin_cents: priceMin,
        priceMax_cents: priceMax,
        createdBy: p.createdBy || 'system',
        createdAt: p.createdAt || new Date().toISOString(),
        // Include AI fields if they exist
        imageUrl: (p as any).imageUrl,
        imageSource: (p as any).imageSource,
        verificationStatus: (p as any).verificationStatus,
        aiRiskScore: (p as any).aiRiskScore,
        aiReason: (p as any).aiReason,
      } as Product);
    });
    console.log(`[getAllProducts] ✓ Loaded ${productsMap.size} products from local data`);
  } catch (localError) {
    console.error('[getAllProducts] Failed to load local products:', localError);
  }
  
  // 2. Try to get Firestore products (with timeout) and merge them
  try {
    console.log('[getAllProducts] Attempting Firestore...');
    const productsRef = collection(db, 'products');
    const snapshot = await withTimeout(getDocs(productsRef), 3000);
    const firestoreProducts = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product))
      .filter((product) => product.verificationStatus !== 'flagged');
    
    // Merge Firestore products (Firestore takes precedence for duplicates)
    firestoreProducts.forEach((p) => {
      productsMap.set(p.id, p);
    });
    
    console.log('[getAllProducts] ✓ Got', firestoreProducts.length, 'from Firestore, merged to total', productsMap.size);
  } catch (error) {
    console.error('[getAllProducts] Firestore unavailable, using local only:', error);
    // That's okay - we already have local products in the map
  }
  
  const result = Array.from(productsMap.values())
    .filter((product) => product.verificationStatus !== 'flagged');
  
  console.log(`[getAllProducts] ✓ Returning ${result.length} total products`);
  return result;
}

export async function getAllProductsIncludingFlagged(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
    
    if (result.length > 0) {
      return result;
    }
    
    // If Firestore is empty, try local fallback
    console.log('Firestore empty, trying local fallback...');
    throw new Error('Firestore returned 0 products');
  } catch (error) {
    console.error('Firestore fetch failed, using local fallback:', error);
    try {
      // Fallback to local data
      const localProducts = loadProducts();
      const result = Object.entries(localProducts).map(([id, p]) => {
        const priceMin = (p as any).priceMin_cents !== undefined ? (p as any).priceMin_cents : (p as any).price_cents;
        const priceMax = (p as any).priceMax_cents !== undefined ? (p as any).priceMax_cents : (p as any).price_cents;
        return {
          id: id || p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          priceMin_cents: priceMin,
          priceMax_cents: priceMax,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        } as Product;
      });
      
      console.log(`[Backfill] Loaded ${result.length} products from local data`);
      return result;
    } catch (fallbackError) {
      console.error('Local fallback also failed:', fallbackError);
      return [];
    }
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', id);
    const snapshot = await getDocs(query(collection(db, 'products'), where('__name__', '==', id)));
    if (snapshot.empty) return null;
    const doc_data = snapshot.docs[0];
    return {
      id: doc_data.id,
      ...doc_data.data(),
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(input: {
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  createdBy: string;
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number;
  aiReason?: string;
  imageQuality?: 'ok' | 'bad' | 'pending';
}): Promise<Product> {
  console.log('[createProduct] Starting...');
  
  // Try Firestore with timeout
  try {
    console.log('[createProduct] Attempting Firestore...');
    const productsRef = collection(db, 'products');
    const newProduct: Omit<Product, 'id'> = {
      title: input.title.trim(),
      brand: input.brand ? input.brand.trim() : null,
      category: input.category.trim(),
      priceMin_cents: input.priceMin_cents,
      priceMax_cents: input.priceMax_cents,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      imageUrl: input.imageUrl || null,
      imageSource: input.imageSource,
      verificationStatus: input.verificationStatus,
      aiRiskScore: input.aiRiskScore,
      aiReason: input.aiReason,
      imageQuality: input.imageQuality,
    };

    const docRef = await withTimeout(addDoc(productsRef, newProduct), 3000);
    console.log('[createProduct] Firestore success:', docRef.id);
    return {
      id: docRef.id,
      ...newProduct,
    };
  } catch (error) {
    console.error('[createProduct] Firestore failed, falling back to local:', error);
    // Fallback to local file storage
    try {
      console.log('[createProduct] Using local storage fallback...');
      const localProducts = loadProducts();
      const nextId = getNextProductId(localProducts);
      const newProduct: Product = {
        id: nextId,
        title: input.title.trim(),
        brand: input.brand ? input.brand.trim() : null,
        category: input.category.trim(),
        priceMin_cents: input.priceMin_cents,
        priceMax_cents: input.priceMax_cents,
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
        imageUrl: input.imageUrl || null,
        imageSource: input.imageSource,
        verificationStatus: input.verificationStatus,
        aiRiskScore: input.aiRiskScore,
        aiReason: input.aiReason,
        imageQuality: input.imageQuality,
      };
      
      localProducts[nextId] = newProduct;
      saveProducts(localProducts);
      console.log(`[createProduct] ✓ Product saved locally with id: ${nextId}`);
      return newProduct;
    } catch (fallbackError) {
      console.error('[createProduct] ✗ Local fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  console.log('[updateProduct] Starting for id:', id);
  
  // Try Firestore with timeout
  try {
    console.log('[updateProduct] Attempting Firestore...');
    const docRef = doc(db, 'products', id);
    await withTimeout(updateDoc(docRef, updates), 3000);
    console.log('[updateProduct] Firestore success');
  } catch (error) {
    console.error('[updateProduct] Firestore failed, falling back to local:', error);
    // Fallback to local file storage
    try {
      console.log('[updateProduct] Using local storage fallback...');
      const localProducts = loadProducts();
      if (localProducts[id]) {
        localProducts[id] = { ...localProducts[id], ...updates };
        saveProducts(localProducts);
        console.log(`[updateProduct] ✓ Product ${id} updated locally`);
      } else {
        console.warn(`[updateProduct] ⚠️ Product ${id} not found in local storage`);
      }
    } catch (fallbackError) {
      console.error('[updateProduct] ✗ Local fallback also failed:', fallbackError);
    }
  }
}

// --- Reviews ---

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('productId', '==', productId));
    const snapshot = await withTimeout(getDocs(q));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Review));
  } catch (error) {
    // Firestore unavailable or timed out, fallback to local reviews.json
    console.log(`Firestore unavailable, falling back to local reviews for product ${productId}`);
    try {
      const localReviews = loadReviews();
      const reviews = localReviews[productId] || [];
      // Add productId to reviews if missing
      return reviews.map(r => ({
        ...r,
        productId,
      } as Review));
    } catch (localError) {
      console.error('Error loading local reviews:', localError);
      return [];
    }
  }
}

export async function addReview(input: {
  productId: string;
  overallRating: number;
  attributes: Review['attributes'];
  notes?: string;
  source: string;
  reviewerName: string;
  reviewerEmail?: string;
  wouldRecommend?: boolean;
  authorClientId?: string;
}): Promise<Review> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const newReview: Omit<Review, 'id'> = {
      productId: input.productId,
      overallRating: input.overallRating,
      attributes: input.attributes,
      notes: input.notes,
      source: input.source,
      reviewerName: input.reviewerName,
      reviewerEmail: input.reviewerEmail,
      wouldRecommend: input.wouldRecommend,
      authorClientId: input.authorClientId,
      created_at: new Date().toISOString(),
    };

    const docRef = await addDoc(reviewsRef, newReview);
    return {
      id: docRef.id,
      ...newReview,
    };
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'reviews', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

// Helper for stats
export async function getProductStats(productId: string) {
  const reviews = await getReviewsByProductId(productId);
  const count = reviews.length;
  const avgRating =
    count > 0
      ? (reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / count).toFixed(1)
      : '0';

  return { avgRating, count };
}
