"use client";

interface ProductCardProps {
  id: number | string;
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
  avg_rating: string;
  review_count: number;
}

export default function ProductCard(props: ProductCardProps) {
  return (
    <a href={`/products/${props.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(226,232,240,0.9)",
          borderRadius: 16,
          padding: 16,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(-3px)";
          el.style.boxShadow = "0 14px 30px rgba(15,23,42,0.12)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: "rgba(14,165,233,0.1)",
              color: "#0369a1",
              padding: "4px 10px",
              borderRadius: 9999,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {props.category}
          </span>
          {props.brand && (
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {props.brand}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {props.title}
        </h3>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
          }}
        >
          {props.price_cents && (
            <span style={{ fontWeight: 700, color: "#059669" }}>
              ${(props.price_cents / 100).toFixed(2)}
            </span>
          )}

          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ color: "#facc15" }}>★</span>
            <strong style={{ color: "#0f172a" }}>{props.avg_rating}</strong>
            <span style={{ color: "#94a3b8" }}>({props.review_count})</span>
          </span>
        </div>
      </div>
    </a>
  );
}
