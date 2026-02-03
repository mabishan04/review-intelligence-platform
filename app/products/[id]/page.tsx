import ProductDetailClient from "../../components/ProductDetailClient";
import { loadProducts, loadReviews } from "@/lib/persistentData";

type Review = {
  id: string;
  overallRating?: number;
  rating?: number | null;
  source?: string | null;
  review_text?: string;
  created_at: string;
  attributes?: any;
  notes?: string;
  reviewerName?: string;
};

type Product = {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
  review_summary?: string;
};

async function getProduct(id: string): Promise<{ product: Product; reviews: Review[] }> {
  // Always load fresh from disk to get the latest data (including newly created products)
  const products = loadProducts();
  const reviews = loadReviews();
  
  const product = products[id];
  
  if (!product) {
    // If product doesn't exist, return empty product
    return {
      product: {
        id,
        title: undefined as any,
        brand: null,
        category: '',
        price_cents: null,
      },
      reviews: [],
    };
  }

  const productData: Product = {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    price_cents: product.price_cents,
  };

  const productReviews = reviews[id] || [];
  // Sort reviews by date - newest first
  const sortedReviews = productReviews.sort((a, b) => {
    try {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Newest first
    } catch {
      return 0;
    }
  });

  return {
    product: productData,
    reviews: sortedReviews,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, reviews } = await getProduct(id);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.overallRating || r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0";

  const recommendPercentage = reviews.length > 0
    ? Math.round((reviews.filter(r => {
        const rating = r.overallRating || r.rating;
        return rating && rating >= 4;
      }).length / reviews.length) * 100)
    : 0;

  // Calculate rating distribution
  const ratingDist = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    const rating = r.overallRating || r.rating;
    if (rating && rating >= 1 && rating <= 5) {
      ratingDist[5 - rating]++;
    }
  });

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Product Header */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "40px 32px",
          }}
        >
          <a
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#0369a1",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 9999,
              backgroundColor: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(148,163,184,0.4)",
              marginBottom: 24,
            }}
          >
            <span style={{ display: "inline-block", transform: "translateY(0.5px)" }}>
              ←
            </span>
            <span>Back to products</span>
          </a>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 32 }}>
                  {product.category === "Phones" || product.category === "Smartphones" ? "📱" : 
                   product.category === "Laptops" ? "💻" :
                   "📦"}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#0ea5e9",
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                    }}
                  >
                    {product.brand || product.category}
                  </div>
                  <h1
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: "8px 0 0 0",
                    }}
                  >
                    {product.title}
                  </h1>
                </div>
              </div>

              {product.price_cents && (
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#059669",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  ${(product.price_cents / 100).toFixed(2)}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                {product.category && (
                  <span
                    style={{
                      fontSize: 13,
                      backgroundColor: "rgba(14,165,233,0.1)",
                      color: "#0369a1",
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 9999,
                    }}
                  >
                    {product.category}
                  </span>
                )}
                {reviews.length > 0 && (
                  <>
                    <span
                      style={{
                        fontSize: 13,
                        backgroundColor: "rgba(250,204,21,0.15)",
                        color: "#78350f",
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 9999,
                      }}
                    >
                      ⭐ {avgRating}/5 ({reviews.length} reviews)
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        backgroundColor: "rgba(34,197,94,0.15)",
                        color: "#166534",
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 9999,
                      }}
                    >
                      ✓ {recommendPercentage}% recommend
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Rating Box */}
            {reviews.length > 0 && (
              <div style={{ 
                textAlign: "center", 
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 32,
                minWidth: 200
              }}>
                <div style={{ fontSize: 56, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  {avgRating}
                </div>
                <div style={{ fontSize: 16, color: "#fbbf24", marginBottom: 16 }}>
                  {'★'.repeat(Math.round(parseFloat(avgRating)))}{'☆'.repeat(5 - Math.round(parseFloat(avgRating)))}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                  Based on <strong>{reviews.length}</strong> verified reviews
                </div>
                
                {/* Mini rating bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
                  {[5, 4, 3, 2, 1].map((star, idx) => (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", width: 16 }}>{star}★</span>
                      <div style={{ 
                        flex: 1, 
                        height: 6, 
                        backgroundColor: "#e5e7eb", 
                        borderRadius: 3,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          backgroundColor: "#f59e0b",
                          width: reviews.length > 0 ? `${(ratingDist[idx] / reviews.length) * 100}%` : "0%",
                          transition: "width 0.3s"
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#9ca3af", width: 20 }}>{ratingDist[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 32px" }}>
        {/* AI Summary Section + Reviews + Form */}
        <ProductDetailClient productId={id} reviews={reviews} productTitle={product.title} />
      </div>
    </main>
  );
}
