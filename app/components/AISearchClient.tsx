"use client";

import { useState, FormEvent } from "react";

type AISearchResult = {
  productId: string;
  name: string;
  brand: string;
  score: number;
  reason: string;
};

function looksLikeSearchIntent(text: string) {
  const keywords = [
    "phone",
    "laptop",
    "tablet",
    "headphone",
    "camera",
    "best",
    "under",
    "budget",
    "gaming",
    "battery",
    "performance",
    "screen",
    "display",
    "fast",
    "lightweight",
    "portable",
  ];

  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k)) || lower.length >= 15;
}

export default function AISearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!looksLikeSearchIntent(trimmed)) {
      setError(
        'Try describing what you\'re looking for, e.g. "Best phone under $700 with good battery life."'
      );
      setSearched(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setError(null);
    setResults([]);
    setExplanation(null);

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Something went wrong");
      }

      const data = await res.json();

      const mapped = (Array.isArray(data.topPicks) ? data.topPicks : []).map(
        (p: any) => ({
          productId: String(p.productId),
          name: String(p.name),
          brand: String(p.brand || ""),
          reason: String(p.reason),
          score:
            typeof p.matchScore === "number"
              ? p.matchScore
              : typeof p.score === "number"
              ? p.score
              : 0,
        })
      );

      setResults(mapped);
      setExplanation(data.explanation || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ marginTop: 32 }}>
      {/* Search Card */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: 24,
          padding: 32,
          marginBottom: 32,
          boxShadow:
            "0 10px 40px rgba(56, 189, 248, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.8)",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="E.g., 'Phone with amazing camera under $800'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "14px 20px",
              fontSize: 15,
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: 12,
              fontFamily: "inherit",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#0f172a",
              outline: "none",
              transition: "all 0.3s ease",
            } as any}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.6)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              padding: "14px 32px",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              opacity: loading || !query.trim() ? 0.5 : 1,
              transition: "all 0.3s ease",
              boxShadow: "0 8px 24px rgba(56, 189, 248, 0.25)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!loading && query.trim()) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#0369a1";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 12px 32px rgba(56, 189, 248, 0.4)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#0284c7";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 8px 24px rgba(56, 189, 248, 0.25)";
              (e.currentTarget as HTMLButtonElement).style.transform =
                "translateY(0)";
            }}
          >
            {loading ? "✨ Searching..." : "🔍 Search"}
          </button>
        </form>
      </div>

      {/* Results */}
      <div style={{}}>
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              padding: 16,
              borderRadius: 16,
              marginBottom: 16,
              fontSize: 14,
              backdropFilter: "blur(10px)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {searched && loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#0284c7",
              background: "rgba(255, 255, 255, 0.6)",
              borderRadius: 16,
              border: "1px solid rgba(56, 189, 248, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 500 }}>🤔 Thinking...</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              Analyzing reviews across our catalog
            </p>
          </div>
        )}

        {!loading && results.length === 0 && searched && (
          <div
            style={{
              padding: 32,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderRadius: 16,
              border: "1px solid rgba(56, 189, 248, 0.2)",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <p style={{ fontSize: 15, color: "#0f172a", marginBottom: 12 }}>
              I need a bit more detail to help you 😊
              <br />
              Try describing a product, budget, or feature you care about.
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#0284c7",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Examples:
            </p>
            <ul
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#475569",
                textAlign: "left",
                display: "inline-block",
                margin: "0 auto",
              }}
            >
              <li>• Best phone under $700 with great battery life</li>
              <li>• Laptop for gaming and school under $1500</li>
              <li>• Budget headphones with good noise cancellation</li>
            </ul>
          </div>
        )}

        {results.length > 0 && (
          <div
            style={{
              marginTop: 16,
            }}
          >
            {explanation && (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.2)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  fontSize: 14,
                  color: "#0f172a",
                  lineHeight: 1.7,
                  backdropFilter: "blur(10px)",
                }}
              >
                ✨ {explanation}
              </div>
            )}

            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#0284c7",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              🎯 Recommended For You
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {results.map((r) => (
                <a
                  key={r.productId}
                  href={`/products/${r.productId}`}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(56, 189, 248, 0.15)",
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(10px)",
                    padding: 20,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "inset 0 1px 1px rgba(56, 189, 248, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(56, 189, 248, 0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "rgba(56, 189, 248, 0.3)";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "translateY(-3px)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 12px 32px rgba(56, 189, 248, 0.15), inset 0 1px 1px rgba(56, 189, 248, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255, 255, 255, 0.6)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "rgba(56, 189, 248, 0.15)";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "inset 0 1px 1px rgba(56, 189, 248, 0.1)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#0f172a",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        {r.name}
                      </div>
                      {r.brand && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 4,
                            margin: 0,
                          }}
                        >
                          {r.brand}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        padding: "8px 12px",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "#059669",
                          margin: 0,
                          marginBottom: 2,
                        }}
                      >
                        Match
                      </p>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#047857",
                          margin: 0,
                        }}
                      >
                        {Math.round(r.score)}%
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {r.reason}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
