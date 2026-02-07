import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, updateProduct } from '@/lib/firestoreHelper';
import { generateProductImageWithAI } from '@/lib/aiProductVerification';

export async function POST(req: NextRequest) {
  try {
    // Admin token guard
    const adminToken = req.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      console.warn('[backfill] Unauthorized attempt without valid admin token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 3 } = await req.json().catch(() => ({ limit: 3 }));

    console.log('[backfill] Starting image generation for up to', limit, 'products');
    const products = await getAllProducts();

    // Only those without imageUrl
    const missing = products.filter((p: any) => !p.imageUrl);
    console.log('[backfill] Found', missing.length, 'products without images');

    // Safety: only do a few at a time to avoid huge token costs
    const toProcess = missing.slice(0, Math.min(limit, missing.length));

    const results: any[] = [];

    for (const product of toProcess) {
      try {
        console.log(`[backfill] Generating image for ${product.title}...`);
        const imageUrl = await generateProductImageWithAI(
          product.title,
          product.brand,
          product.category
        );

        if (imageUrl) {
          await updateProduct(product.id, {
            imageUrl,
            imageSource: 'ai_generated',
          });

          console.log(`[backfill] ✓ Updated ${product.id} with image`);
          results.push({
            id: product.id,
            title: product.title,
            imageUrl,
            status: 'success',
          });
        } else {
          throw new Error('Image generation returned null');
        }
      } catch (err) {
        console.error(`[backfill] Failed for ${product.id}:`, err);
        results.push({
          id: product.id,
          title: product.title,
          error: (err as Error).message,
          status: 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
      remainingWithoutImage: Math.max(0, missing.length - toProcess.length),
      message: `Generated images for ${results.filter((r) => r.status === 'success').length} product(s). ${Math.max(0, missing.length - toProcess.length)} remaining.`,
    });
  } catch (error) {
    console.error('[backfill] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate images', details: (error as Error).message },
      { status: 500 }
    );
  }
}
