import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getAllProducts, updateProduct } from '@/lib/firestoreHelper';
import { findSimilarProduct } from '@/lib/duplicateChecker';
import { processProductWithAI } from '@/lib/aiProductVerification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('[products/create] Received POST request');
    const body = await req.json();
    console.log('[products/create] Body:', body);
    const { title, brand, category, priceMin, priceMax, description } = body;

    if (!title || !category) {
      console.warn('[products/create] Missing required fields');
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    // Get user ID from auth header or use anonymous
    const userId = req.headers.get('x-user-id') || 'anonymous';

    // Convert prices to cents (handle both as range or single price for backwards compat)
    let priceMin_cents: number | null = null;
    let priceMax_cents: number | null = null;
    
    if (priceMin !== null && priceMin !== undefined) {
      priceMin_cents = typeof priceMin === 'number' 
        ? Math.round(priceMin * 100)
        : priceMin 
        ? Math.round(Number(priceMin) * 100)
        : null;
    }
    
    if (priceMax !== null && priceMax !== undefined) {
      priceMax_cents = typeof priceMax === 'number'
        ? Math.round(priceMax * 100)
        : priceMax
        ? Math.round(Number(priceMax) * 100)
        : null;
    }

    // ===== 1) RUN AI VERIFICATION FIRST (before creating) =====
    console.log('[products/create] Running AI verification...');
    const aiResult = await processProductWithAI(
      title,
      brand || null,
      category,
      description
    );

    console.log('[products/create] AI Result:', {
      status: aiResult.verificationStatus,
      score: aiResult.aiRiskScore,
      reason: aiResult.aiReason,
    });

    // Block obviously wrong stuff (flagged or high risk)
    if (aiResult.verificationStatus === 'flagged' || aiResult.aiRiskScore < 30) {
      console.warn('[products/create] Product blocked by AI verification');
      return NextResponse.json(
        {
          error: 'This product does not appear to be a valid tech/consumer electronics item.',
          aiReason: aiResult.aiReason,
          aiRiskScore: aiResult.aiRiskScore,
        },
        { status: 400 }
      );
    }

    // ===== 2) AI PASSED - Now create product with AI metadata =====
    console.log('[products/create] AI verification passed, creating product...');
    const product = await createProduct({
      title,
      brand: brand || null,
      category,
      priceMin_cents,
      priceMax_cents,
      createdBy: userId,
      // Include AI results in product creation
      imageUrl: aiResult.imageUrl || undefined,
      imageSource: aiResult.imageSource,
      verificationStatus: aiResult.verificationStatus,
      aiRiskScore: aiResult.aiRiskScore,
      aiReason: aiResult.aiReason,
      imageQuality: aiResult.imageQuality,
    });

    console.log('[products/create] ✓ Product created:', product.id);

    return NextResponse.json(
      {
        success: true,
        productId: product.id,
        product,
        message: `Product created and verified. Status: ${aiResult.verificationStatus}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[products/create] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to create product: ${errorMsg}` },
      { status: 500 }
    );
  }
}
