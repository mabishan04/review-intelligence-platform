import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/firestoreHelper';
import { generateProductImageWithAI } from '@/lib/aiProductVerification';

/**
 * POST /api/products/[id]/regenerate-image
 * Admin-only endpoint to regenerate just the AI image for a product
 * Does NOT re-verify the product, just generates a new image
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin token
    const adminToken = req.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      console.warn(`[regenerate-image] Unauthorized: invalid admin token`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    console.log(`[regenerate-image] Starting for product: ${productId}`);

    // Get current product
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate new image
    console.log(`[regenerate-image] Generating new image for ${product.title}...`);
    const newImageUrl = await generateProductImageWithAI(
      product.title,
      product.brand,
      product.category
    );

    if (!newImageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Update product with new image
    await updateProduct(productId, {
      imageUrl: newImageUrl,
      imageSource: 'ai_generated',
      imageQuality: 'pending', // Will need review
    });

    console.log(`[regenerate-image] ✓ Updated product ${productId} with new image`);

    return NextResponse.json({
      success: true,
      productId,
      imageUrl: newImageUrl,
      message: 'Image regenerated successfully. Please review the new image.',
    });
  } catch (error) {
    console.error('[regenerate-image] Error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate image', details: (error as Error).message },
      { status: 500 }
    );
  }
}
