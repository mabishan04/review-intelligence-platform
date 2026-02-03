export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        background: "linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "560px" }}>
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#475569",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Product not found. This product may have been removed or doesn't exist.
        </p>
        <a
          href="/products"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "12px 24px",
            borderRadius: 9999,
            backgroundColor: "#0284c7",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            transition: "background-color 0.2s ease",
          }}
        >
          ← Back to Products
        </a>
      </div>
    </main>
  );
}
