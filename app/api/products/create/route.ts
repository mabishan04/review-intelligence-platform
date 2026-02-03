import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getAllProducts } from '@/lib/firestoreHelper';
import { findSimilarProduct } from '@/lib/duplicateChecker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, brand, category, price } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Get all products from Firestore for duplicate check
    const allProducts = await getAllProducts();
    const mockProductsForCheck: Record<string, any> = {};
    allProducts.forEach((p) => {
      mockProductsForCheck[p.id] = p;
    });
    
    // Use existing duplicate check logic
    const match = findSimilarProduct(title, brand, category, mockProductsForCheck);
    if (match) {
      return NextResponse.json(
        {
          duplicate: true,
          productId: match.product.id,
          productTitle: match.product.title,
        },
        { status: 200 }
      );
    }

    const price_cents =
      typeof price === 'number'
        ? Math.round(price * 100)
        : price
        ? Math.round(Number(price) * 100)
        : null;

    // Get user ID from auth header or use anonymous
    const userId = req.headers.get('x-user-id') || 'anonymous';

    const product = await createProduct({
      title,
      brand: brand || null,
      category,
      price_cents,
      createdBy: userId,
    });

    return NextResponse.json(
      {
        success: true,
        productId: product.id,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[products/create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
