// app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadReviews, saveReviews } from "@/lib/persistentData";

// Helper: find which product a review belongs to (search across all products)
function findReviewById(reviewId: string, allReviews: Record<string, any[]>) {
  for (const [productId, list] of Object.entries(allReviews)) {
    const index = (list as any[]).findIndex((r: any) => r.id === reviewId);
    if (index !== -1) {
      return { productId, index };
    }
  }
  return null;
}

// UPDATE a review (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const body = await req.json();

    // Always reload from disk to get latest data
    const allReviews = loadReviews();

    const location = findReviewById(reviewId, allReviews);
    if (!location) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const { productId, index } = location;
    const existing = (allReviews as any)[productId][index];

    // Update allowed fields
    const updated = {
      ...existing,
      overallRating: body.overallRating ?? existing.overallRating,
      attributes: body.attributes ?? existing.attributes,
      notes: body.notes ?? existing.notes,
      wouldRecommend:
        typeof body.wouldRecommend === "boolean"
          ? body.wouldRecommend
          : existing.wouldRecommend,
      updated_at: new Date().toISOString(),
    };

    (allReviews as any)[productId][index] = updated;
    saveReviews(allReviews);

    return NextResponse.json({ review: updated }, { status: 200 });
  } catch (err) {
    console.error("[reviews PUT] error", err);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE a review
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    // Always reload from disk to get latest data
    const allReviews = loadReviews();

    const location = findReviewById(reviewId, allReviews);
    if (!location) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const { productId, index } = location;
    const list = (allReviews as any)[productId] as any[];
    const [deleted] = list.splice(index, 1);

    saveReviews(allReviews);

    return NextResponse.json(
      { success: true, review: deleted },
      { status: 200 }
    );
  } catch (err) {
    console.error("[reviews DELETE] error", err);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
