import { NextResponse } from "next/server";
import { getProductById, getReviewsByProductId } from "@/lib/firestoreHelper";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idStr = url.pathname.split("/").pop();

  if (!idStr) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    const product = await getProductById(idStr);

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reviews = await getReviewsByProductId(idStr);

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        brand: product.brand,
        category: product.category,
        priceMin_cents: product.priceMin_cents,
        priceMax_cents: product.priceMax_cents,
        createdBy: product.createdBy,
        createdAt: product.createdAt,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.overallRating,
        source: r.source,
        review_text: r.notes,
        created_at: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
