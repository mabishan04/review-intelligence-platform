import ProductDetailClient from "../../components/ProductDetailClient";
import RegenerateImageButton from "../../components/RegenerateImageButton";
import { loadProducts, loadReviews } from "@/lib/persistentData";
import { getProductById } from "@/lib/firestoreHelper";

// Always revalidate/refresh to get latest reviews
export const revalidate = 0;

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
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  review_summary?: string;
  // AI verification fields
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number | null;
  aiReason?: string | null;
  imageQuality?: 'ok' | 'bad' | 'pending';
};

async function getProduct(id: string): Promise<{ product: Product; reviews: Review[] }> {
  // Try to load from Firestore first
  try {
    const firestoreProduct = await getProductById(id);
    if (firestoreProduct) {
      const reviews = loadReviews();
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
        product: {
          id: firestoreProduct.id,
          title: firestoreProduct.title,
          brand: firestoreProduct.brand,
          category: firestoreProduct.category,
          priceMin_cents: firestoreProduct.priceMin_cents,
          priceMax_cents: firestoreProduct.priceMax_cents,
          imageUrl: firestoreProduct.imageUrl,
          imageSource: firestoreProduct.imageSource,
          verificationStatus: firestoreProduct.verificationStatus,
          aiRiskScore: firestoreProduct.aiRiskScore,
          aiReason: firestoreProduct.aiReason,
        },
        reviews: sortedReviews,
      };
    }
  } catch (error) {
    console.log('Firestore fetch failed, using fallback:', error);
  }

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
        priceMin_cents: null,
        priceMax_cents: null,
      },
      reviews: [],
    };
  }

  const productData: Product = {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    priceMin_cents: (product as any).priceMin_cents || (product as any).price_cents || null,
    priceMax_cents: (product as any).priceMax_cents || (product as any).price_cents || null,
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

          {/* Product Image */}
          {product.imageUrl && (
            <div
              style={{
                width: "100%",
                height: 300,
                backgroundColor: "#f1f5f9",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Regenerate Image Button (AI images only) */}
          {product.imageUrl && product.imageSource === "ai_generated" && (
            <div style={{ marginBottom: 32 }}>
              <RegenerateImageButton
                productId={id}
                productTitle={product.title}
                imageSource={product.imageSource}
              />
            </div>
          )}

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

              {product.priceMin_cents || product.priceMax_cents ? (
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#059669",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  {product.priceMin_cents && product.priceMax_cents ? (
                    <>
                      ${(product.priceMin_cents / 100).toFixed(2)} – ${(product.priceMax_cents / 100).toFixed(2)}
                    </>
                  ) : product.priceMin_cents ? (
                    <>
                      From ${(product.priceMin_cents / 100).toFixed(2)}
                    </>
                  ) : (
                    <>
                      Up to ${(product.priceMax_cents! / 100).toFixed(2)}
                    </>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 16,
                    color: "#9ca3af",
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  Price varies by location and retailer
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
                
                {/* Verification Badge */}
                {product.verificationStatus === 'verified' && (
                  <span
                    style={{
                      fontSize: 13,
                      backgroundColor: "rgba(34,197,94,0.1)",
                      color: "#15803d",
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 9999,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ✓ Verified Listing
                  </span>
                )}
                {product.verificationStatus === 'unverified' && (
                  <span
                    style={{
                      fontSize: 13,
                      backgroundColor: "rgba(148,163,184,0.1)",
                      color: "#64748b",
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 9999,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ? Not Yet Verified
                  </span>
                )}

                {/* Image Source */}
                {product.imageSource === 'ai_generated' && (
                  <span
                    style={{
                      fontSize: 12,
                      backgroundColor: "rgba(124,58,237,0.1)",
                      color: "#7c3aed",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontStyle: "italic",
                    }}
                  >
                    🤖 Image generated with AI
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
