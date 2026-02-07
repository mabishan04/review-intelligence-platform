import { NextRequest, NextResponse } from 'next/server';
import { getAllProductsIncludingFlagged, updateProduct } from '@/lib/firestoreHelper';
import { generateProductImageWithAI, verifyProductWithAI } from '@/lib/aiProductVerification';

/**
 * Admin endpoint to backfill images and verification for existing products
 * POST /api/admin/process-existing-products
 *
 * This processes all products in the catalog:
 * - Generates AI images for products without images
 * - Runs AI verification on all products
 * - Updates Firestore with results
 * - Runs in background and returns immediately
 */
export async function POST(req: NextRequest) {
  try {
    // Security: In production, add proper auth check here
    // const token = req.headers.get('Authorization');
    // if (!token || !validateAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch all products (including flagged ones for processing)
    const allProducts = await getAllProductsIncludingFlagged();

    if (allProducts.length === 0) {
      return NextResponse.json(
        { message: 'No products to process' },
        { status: 200 }
      );
    }

    console.log(`[Backfill] ⏳ Starting background processing of ${allProducts.length} products...`);

    // Start background processing (don't wait for completion)
    processProductsInBackground(allProducts).catch((error) => {
      console.error('[Backfill] ❌ Background processing error:', error);
    });

    return NextResponse.json(
      {
        success: true,
        message: `Processing ${allProducts.length} products in background`,
        productsToProcess: allProducts.length,
        status: 'started',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin/process-existing-products] Error:', error);
    return NextResponse.json(
      { error: 'Failed to start background processing' },
      { status: 500 }
    );
  }
}

/**
 * Background task to process all products
 * Generates images and runs verification
 */
async function processProductsInBackground(products: any[]) {
  console.log(`[Backfill] 🚀 STARTED: Processing ${products.length} products`);

  let processed = 0;
  let imagesGenerated = 0;
  let verified = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // Skip if product already has image and verification
      const needsImage = !product.imageUrl;
      const needsVerification = product.verificationStatus === undefined;

      if (!needsImage && !needsVerification) {
        console.log(`[Backfill] ⏭️  ${product.id} - Already processed, skipping`);
        continue;
      }

      console.log(`[Backfill] 🔄 Processing ${product.id}: "${product.title}"`);

      // Generate image if needed
      let imageUrl = product.imageUrl;
      let imageSource = product.imageSource;

      if (needsImage) {
        try {
          console.log(`[Backfill]   → Generating image for "${product.title}"...`);
          const generatedUrl = await generateProductImageWithAI(
            product.title,
            product.brand || null,
            product.category
          );

          if (generatedUrl) {
            imageUrl = generatedUrl;
            imageSource = 'ai_generated';
            imagesGenerated++;
            console.log(`[Backfill]   ✅ Image generated: ${imageUrl.substring(0, 50)}...`);
          } else {
            console.log(`[Backfill]   ⚠️  Image generation returned null`);
          }
        } catch (imgError) {
          console.error(`[Backfill]   ❌ Image generation failed:`, imgError);
          errors++;
        }
      }

      // Verify product if needed
      let verificationStatus = product.verificationStatus || 'unverified';
      let aiRiskScore = product.aiRiskScore || null;
      let aiReason = product.aiReason || null;

      if (needsVerification) {
        try {
          console.log(`[Backfill]   → Verifying product...`);
          const verification = await verifyProductWithAI(
            product.title,
            product.brand || null,
            product.category,
            product.description
          );

          verificationStatus = verification.status;
          aiRiskScore = verification.score;
          aiReason = verification.reason;
          verified++;
          console.log(
            `[Backfill]   ✅ Verified: ${verificationStatus} (score: ${aiRiskScore}/100)`
          );
        } catch (verifyError) {
          console.error(`[Backfill]   ❌ Verification failed:`, verifyError);
          errors++;
        }
      }

      // Update product in Firestore (non-blocking)
      // Fire and forget - don't wait for Firestore, continue processing
      if (imageUrl || verificationStatus !== 'unverified') {
        updateProduct(product.id, {
          imageUrl: imageUrl || null,
          imageSource: imageSource || null,
          verificationStatus,
          aiRiskScore,
          aiReason,
        }).catch((updateError) => {
          console.warn(`[Backfill]   ⚠️  Firestore update failed for ${product.id} (offline?):`, 
            updateError?.message || updateError);
        });
      }

      processed++;
      console.log(
        `[Backfill] ✓ ${processed}/${products.length} complete (${Math.round(
          (processed / products.length) * 100
        )}%)\n`
      );

      // Add a small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[Backfill] ❌ Unexpected error processing ${product.id}:`, error);
      errors++;
    }
  }

  console.log(`
╔════════════════════════════════════════╗
║       BACKFILL PROCESS COMPLETE        ║
╠════════════════════════════════════════╣
║ Total Processed: ${String(processed).padEnd(24)}║
║ Images Generated: ${String(imagesGenerated).padEnd(22)}║
║ Verified: ${String(verified).padEnd(31)}║
║ Errors: ${String(errors).padEnd(33)}║
╚════════════════════════════════════════╝
  `);
}

