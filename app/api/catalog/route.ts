import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firestoreHelper";
import { mockReviews, getProductStats } from "@/lib/mockData";

export async function GET() {
  const allProducts = await getAllProducts();
  const products = allProducts.map((product) => {
    const { avgRating, count } = getProductStats(product.id);
    return {
      id: product.id,
      title: product.title,
      brand: product.brand,
      category: product.category,
      priceMin_cents: product.priceMin_cents,
      priceMax_cents: product.priceMax_cents,
      avg_rating: parseFloat(avgRating),
      review_count: count,
      // Include AI fields for image display
      imageUrl: product.imageUrl,
      imageSource: product.imageSource,
      verificationStatus: product.verificationStatus,
      aiRiskScore: product.aiRiskScore,
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
