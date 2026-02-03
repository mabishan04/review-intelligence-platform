"use client";

export default function ViewAllButton() {
  return (
    <a
      href="/products"
      style={{
        display: "inline-block",
        padding: "14px 40px",
        backgroundColor: "#f3f4f6",
        color: "#1f2937",
        textDecoration: "none",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        transition: "all 0.2s",
        border: "1px solid #e5e7eb",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#e5e7eb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#f3f4f6";
      }}
    >
      View All Products →
    </a>
  );
}
