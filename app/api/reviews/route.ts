import { NextRequest, NextResponse } from "next/server";
import { addReview } from "@/lib/mockData";

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
    } = body;

    // Basic validation
    if (!productId || overallRating == null || !reviewerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
    });

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
