import ProductCard from "../components/ProductCard";
import ProductFormModal from "../components/ProductFormModal";
import ProductsPageClient from "./ProductsPageClient";
import { mockProducts, mockReviews, getProductStats } from "@/lib/mockData";

// Always revalidate to show latest reviews and products
export const revalidate = 0;

type CatalogItem = {
  id: number | string;
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  avg_rating: string;
  review_count: number;
  // AI fields
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number | null;
};

async function getCatalog(): Promise<CatalogItem[]> {
  try {
    const res = await fetch("http://localhost:3000/api/catalog", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("API unavailable");
    }
    const data = await res.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error("Invalid data");
    }
    // API returns all fields including priceMin_cents, priceMax_cents, imageUrl, imageSource, verificationStatus, aiRiskScore
    return data.products.map((p: any) => ({
      id: p.id,
      title: p.title,
      brand: p.brand,
      category: p.category,
      priceMin_cents: p.priceMin_cents,
      priceMax_cents: p.priceMax_cents,
      avg_rating: p.avg_rating || "0",
      review_count: p.review_count || 0,
      imageUrl: p.imageUrl,
      imageSource: p.imageSource,
      verificationStatus: p.verificationStatus,
      aiRiskScore: p.aiRiskScore,
    }));
  } catch (error) {
    // Use shared mock data that's always in sync
    const products: CatalogItem[] = [];
    
    // Add ALL products from mockProducts (includes seed products and user-created)
    for (const [id, product] of Object.entries(mockProducts)) {
      const { avgRating, count } = getProductStats(id);
      // Keep string ID for user-created products, parse numeric ones
      const numId = isNaN(parseInt(id)) ? id : parseInt(id);
      products.push({
        id: numId,
        title: product.title,
        brand: product.brand,
        category: product.category,
        priceMin_cents: (product as any).priceMin_cents || (product as any).price_cents || null,
        priceMax_cents: (product as any).priceMax_cents || (product as any).price_cents || null,
        avg_rating: avgRating,
        review_count: count,
        imageUrl: (product as any).imageUrl || null,
        imageSource: (product as any).imageSource,
        verificationStatus: (product as any).verificationStatus,
        aiRiskScore: (product as any).aiRiskScore,
      });
    }
    
    return products;
  }
}

export default async function ProductsPage() {
  const products = await getCatalog();
  const categories = Array.from(
    new Set(products.map((p) => p.category))
  ).sort();

  return (
    <>
      <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "40px 32px 64px",
          }}
        >
          {/* Back link – user control & freedom */}
          <div style={{ marginBottom: 16 }}>
            <a
              href="/"
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
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: "translateY(0.5px)",
                }}
              >
                ←
              </span>
              <span>Back to home</span>
            </a>
          </div>

          {/* Page header */}
          <header style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#0ea5e9",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Catalog
            </p>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 700,
                margin: 0,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              All Products
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                marginTop: 8,
                maxWidth: 560,
              }}
            >
              Browse the full catalog and use AI-powered summaries and filters to
              compare products by real-world performance, not just specs.
            </p>
          </header>

          {/* Filters + list */}
          <section
            style={{
              borderRadius: 24,
              backgroundColor: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(226,232,240,0.9)",
              boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
              padding: 24,
            }}
          >
            <ProductsPageClient products={products} categories={categories} />
          </section>
        </div>
      </main>

      {/* Floating Action Button with Modal */}
      <ProductFormModal />
    </>
  );
}
