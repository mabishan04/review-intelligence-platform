'use client';

import AiSummaryDemo from "./AiSummaryDemo";

export default function HeroSection() {
  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          paddingTop: "80px",
          paddingBottom: "60px",
          background: "white",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            paddingLeft: "32px",
            paddingRight: "32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "center",
          }}
        >
          {/* Left Column - Copy */}
          <div>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: 800,
                lineHeight: 1.15,
                color: "#0f172a",
                margin: "0 0 20px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Make Smarter Buying Decisions
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: "#475569",
                margin: "0 0 12px 0",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Powered by real user reviews and AI insights
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                margin: "0 0 40px 0",
                lineHeight: 1.7,
              }}
            >
              No sponsored bias. Just transparency and intelligence.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/assistant"
                style={{
                  display: "inline-block",
                  padding: "14px 32px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                }}
                onMouseEnter={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.backgroundColor = "#1d4ed8";
                  el.style.boxShadow = "0 8px 20px rgba(37, 99, 235, 0.25)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.backgroundColor = "#2563eb";
                  el.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.15)";
                  el.style.transform = "translateY(0)";
                }}
              >
                Find the Right Product
              </a>
              <a
                href="/products"
                style={{
                  display: "inline-block",
                  padding: "14px 32px",
                  backgroundColor: "white",
                  color: "#2563eb",
                  textDecoration: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  border: "1.5px solid #2563eb",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.backgroundColor = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  const el = e.target as HTMLAnchorElement;
                  el.style.backgroundColor = "white";
                }}
              >
                Browse Products
              </a>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <AiSummaryDemo />
          </div>
        </div>
      </section>
    </>
  );
}
