type CatalogItem = {
  id: number;
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
  avg_rating: string; // pg returns numeric as string
  review_count: number;
};

async function getCatalog(): Promise<CatalogItem[]> {
  const res = await fetch("http://localhost:3000/api/catalog", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load catalog");
  const data = await res.json();
  return data.products;
}

export default async function Home() {
  const products = await getCatalog();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Review Intelligence Platform
      </h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Products ranked by review volume and average rating.
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {products.map((p) => (
          <a
            key={p.id}
            href={`/products/${p.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 650 }}>{p.title}</div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>
                {p.brand ? `${p.brand} • ` : ""}
                {p.category}
                {p.price_cents ? ` • $${(p.price_cents / 100).toFixed(2)}` : ""}
              </div>

              <div style={{ marginTop: 10 }}>
                ⭐ {p.avg_rating} • {p.review_count} reviews
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
