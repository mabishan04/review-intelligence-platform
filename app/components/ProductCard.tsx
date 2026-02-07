"use client";

interface ProductCardProps {
  id: number | string;
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  avg_rating: string;
  review_count: number;
  // AI verification fields
  imageUrl?: string | null;
  imageSource?: 'user_uploaded' | 'ai_generated' | 'official';
  verificationStatus?: 'verified' | 'unverified' | 'flagged';
  aiRiskScore?: number | null;
}

export default function ProductCard(props: ProductCardProps) {
  const getVerificationBadge = () => {
    if (props.verificationStatus === 'verified') {
      return {
        icon: '✓',
        text: 'Verified',
        bg: 'rgba(34,197,94,0.1)',
        color: '#15803d',
      };
    }
    if (props.verificationStatus === 'unverified') {
      return {
        icon: '?',
        text: 'Unverified',
        bg: 'rgba(148,163,184,0.1)',
        color: '#64748b',
      };
    }
    // flagged status shouldn't appear here (filtered out), but just in case
    return null;
  };

  const badge = getVerificationBadge();

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
        {/* Product Image */}
        {props.imageUrl && (
          <div
            style={{
              width: "100%",
              height: 160,
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <img
              src={props.imageUrl}
              alt={props.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
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
              whiteSpace: "nowrap",
            }}
          >
            {props.category}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: badge.bg,
                color: badge.color,
                padding: "4px 8px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 3,
                whiteSpace: "nowrap",
              }}
            >
              {badge.icon} {badge.text}
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

        {/* Brand & AI Generated Tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {props.brand && (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {props.brand}
            </span>
          )}
          {props.imageSource === 'ai_generated' && (
            <span style={{ fontSize: 9, color: "#7c3aed", fontStyle: "italic" }}>
              Image by AI
            </span>
          )}
        </div>

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
          {props.priceMin_cents || props.priceMax_cents ? (
            <span style={{ fontWeight: 700, color: "#059669" }}>
              {props.priceMin_cents && props.priceMax_cents ? (
                <>
                  ${(props.priceMin_cents / 100).toFixed(2)} – ${(props.priceMax_cents / 100).toFixed(2)}
                </>
              ) : props.priceMin_cents ? (
                <>
                  From ${(props.priceMin_cents / 100).toFixed(2)}
                </>
              ) : (
                <>
                  Up to ${(props.priceMax_cents! / 100).toFixed(2)}
                </>
              )}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Price varies
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
