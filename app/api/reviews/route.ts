import { NextRequest, NextResponse } from "next/server";
import { addReview, getAllProducts } from "@/lib/mockData";
import { applyReviewContribution } from "@/lib/firebaseUserHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      productTitle,
      overallRating,
      attributes,
      notes,
      reviewerName,
      reviewerEmail,
      source,
      wouldRecommend,
      authorClientId,
      userId,
    } = body;

    // Basic validation
    if (!productId || overallRating == null || !reviewerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO (Copilot):
    // Get the product to find its category field.
    // This category will be passed to applyReviewContribution for category expert tracking.
    const allProducts = getAllProducts();
    const product = allProducts.find((p) => p.id === String(productId));
    const category = product?.category || "General";

    const finalUserId = userId || "demo-user";
    const hasNotes = !!(notes && notes.trim().length > 0);
    const hasAttributes =
      attributes && Object.values(attributes).some((v) => v !== 5);

    const newReview = addReview({
      productId: String(productId),
      overallRating: Number(overallRating),
      attributes:
        attributes || {
          battery: 5,
          durability: 5,
          display: 5,
          performance: 5,
          camera: 5,
          value: 5,
          design: 5,
        },
      notes: notes?.trim() || undefined,
      source: source || "Website",
      reviewerName: reviewerName.trim(),
      reviewerEmail: reviewerEmail?.trim() || undefined,
      wouldRecommend: !!wouldRecommend,
      authorClientId: authorClientId || undefined,
      userId: finalUserId,
      category,
    });

    // Apply gamification: update user points, badges, etc.
    // This is best-effort; don't break review creation if Firestore fails
    try {
      await applyReviewContribution(finalUserId, category, {
        hasNotes,
        hasAttributes,
        recommend: wouldRecommend,
      });
    } catch (gamificationError) {
      console.warn(
        '[gamification] Warning: Failed to apply review contribution to Firestore',
        gamificationError
      );
      // Don't throw - review was already saved successfully
    }

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
