import { pool } from "@/lib/db";

type Review = {
  id: string;
  rating: number | null;
  source: string | null;
  review_text: string;
  created_at: string;
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
  const productRes = await pool.query(
    `select id, title, brand, category, price_cents, review_summary
     from products
     where id = $1`,
    [id]
  );

  if (productRes.rowCount === 0) {
    throw new Error("Product not found");
  }

  const reviewsRes = await pool.query(
    `select id, rating, source, review_text, created_at
     from reviews
     where product_id = $1
     order by id asc`,
    [id]
  );

  return {
    product: productRes.rows[0],
    reviews: reviewsRes.rows,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;          // ✅ unwrap params
  const { product, reviews } = await getProduct(id);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <a href="/" style={{ opacity: 0.8, textDecoration: "none", color: "inherit" }}>
        ← Back
      </a>

      <h1 style={{ fontSize: 28, fontWeight: 750, marginTop: 12 }}>{product.title}</h1>

      <div style={{ marginTop: 6, opacity: 0.85 }}>
        {product.brand ? `${product.brand} • ` : ""}
        {product.category}
        {product.price_cents ? ` • $${(product.price_cents / 100).toFixed(2)}` : ""}
      </div>

      {product.review_summary && (
        <>
          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>
            Summary
          </h2>
          <p style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.6 }}>
            {product.review_summary}
          </p>
        </>
      )}

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>Reviews</h2>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 650 }}>
              ⭐ {r.rating ?? "?"} {r.source ? `• ${r.source}` : ""}
            </div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{r.review_text}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
