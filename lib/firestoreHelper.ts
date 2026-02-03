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
  price_cents: number | null;
  createdBy: string; // "system" for seed data, or user ID
  createdAt: string;
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
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
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
  price_cents: number | null;
  createdBy: string;
}): Promise<Product> {
  try {
    const productsRef = collection(db, 'products');
    const newProduct: Omit<Product, 'id'> = {
      title: input.title.trim(),
      brand: input.brand ? input.brand.trim() : null,
      category: input.category.trim(),
      price_cents: input.price_cents,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(productsRef, newProduct);
    return {
      id: docRef.id,
      ...newProduct,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// --- Reviews ---

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Review));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
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
