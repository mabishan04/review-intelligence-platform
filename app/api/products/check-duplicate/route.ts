import { NextRequest, NextResponse } from 'next/server';
import { findSimilarProduct } from '@/lib/duplicateChecker';
import { getAllProducts } from '@/lib/firestoreHelper';
import { mockProducts } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { duplicate: false, reason: 'No title or too short' },
        { status: 200 }
      );
    }

    // Try to get products from Firestore, fallback to mockData
    let productsMap: Record<string, any> = mockProducts;
    try {
      const allProducts = await getAllProducts();
      if (allProducts && allProducts.length > 0) {
        productsMap = {};
        allProducts.forEach((p) => {
          productsMap[p.id] = p;
        });
      }
    } catch (error) {
      console.warn('[check-duplicate] Using fallback mockData:', error);
    }

    const match = findSimilarProduct(title, brand || undefined, category || undefined, productsMap);

    if (match) {
      return NextResponse.json(
        {
          duplicate: true,
          similarity: match.similarity,
          product: {
            id: match.product.id,
            title: match.product.title,
            brand: match.product.brand,
            category: match.product.category,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ duplicate: false }, { status: 200 });
  } catch (error) {
    console.error('[check-duplicate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
