"use client";

import AiSummaryDemo from "./AiSummaryDemo";

export default function HeroSection() {
  return (
    <section
      style={{
        paddingTop: "80px",
        paddingBottom: "120px",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingLeft: "32px",
          paddingRight: "32px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: "72px",
          alignItems: "center",
        }}
      >
        {/* Left Column */}
        <div>
          {/* Small AI badge – helps with "match to real world" & recognition */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 9999,
              backgroundColor: "rgba(15,23,42,0.04)",
              border: "1px solid rgba(148,163,184,0.4)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "9999px",
                background:
                  "radial-gradient(circle at 30% 30%, #4ade80, #22c55e)",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#0f172a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              AI-powered review intelligence
            </span>
          </div>

          <h1
            style={{
              fontSize: "52px",
              fontWeight: 800,
              lineHeight: 1.1,
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
            AI-powered insights from real user reviews.
          </p>

          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              margin: "0 0 40px 0",
              lineHeight: 1.7,
            }}
          >
            Skip the marketing noise. Our AI analyzes thousands of real user reviews to help you find products that actually match what you're looking for.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/products"
              style={{
                padding: "12px 24px",
                borderRadius: 9999,
                backgroundColor: "#0284c7",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
                transition: "background-color 0.2s ease, transform 0.2s ease",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Explore Products
            </a>
            <a
              href="/ai-search"
              style={{
                padding: "12px 24px",
                borderRadius: 9999,
                border: "1px solid #0ea5e9",
                backgroundColor: "rgba(255,255,255,0.7)",
                color: "#0369a1",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backdropFilter: "blur(8px)",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "9999px",
                  background: "radial-gradient(circle at 30% 30%, #22c55e, #16a34a)",
                }}
              />
              AI Search
            </a>
          </div>

          <div
            style={{
              marginTop: "60px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
            }}
          >
            <div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>1000+</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: 4 }}>Products Analyzed</div>
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>50K+</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: 4 }}>Real Reviews</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <AiSummaryDemo />
        </div>
      </div>
    </section>
  );
}
