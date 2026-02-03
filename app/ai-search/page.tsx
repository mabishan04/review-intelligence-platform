import AISearchClient from "../components/AISearchClient";

export default function AISearchPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 55%), linear-gradient(135deg, #ecf0f5 0%, #dbeafe 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >

      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "80px 24px 120px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header / intro */}
        <header style={{ marginBottom: 64, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 9999,
              backgroundColor: "rgba(15,23,42,0.04)",
              border: "1px solid rgba(148,163,184,0.4)",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, #4ade80, #22c55e)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#0f172a",
                fontWeight: 600,
              }}
            >
              AI-Powered Discovery
            </span>
          </div>

          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            Tell our AI what you&apos;re looking for
          </h1>

          <p
            style={{
              maxWidth: 620,
              fontSize: 16,
              color: "#475569",
              margin: "0 auto",
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Describe your ideal product in plain language. Our AI analyzes thousands of real reviews to find exactly what matches your needs.
          </p>
        </header>

        {/* Main search UI */}
        <AISearchClient />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </main>
  );
}
