import { NextResponse } from "next/server";
import { mockProducts, mockReviews, getProductStats } from "@/lib/mockData";

export async function GET() {
  const products = Object.entries(mockProducts).map(([id, product]) => {
    const { avgRating, count } = getProductStats(id);
    return {
      id: isNaN(parseInt(id)) ? id : parseInt(id),
      title: product.title,
      brand: product.brand,
      category: product.category,
      price_cents: product.price_cents,
      avg_rating: parseFloat(avgRating),
      review_count: count,
    };
  });

  // Sort by review count, then rating, then ID
  products.sort((a, b) => {
    if (b.review_count !== a.review_count) return b.review_count - a.review_count;
    if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
    return String(a.id).localeCompare(String(b.id));
  });

  return NextResponse.json({ products });
}
