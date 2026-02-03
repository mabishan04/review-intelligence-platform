"use client";

import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";

type CatalogItem = {
  id: number | string;
  title: string;
  brand: string | null;
  category: string;
  price_cents: number | null;
  avg_rating: string;
  review_count: number;
};

export default function ProductsPageClient({
  products,
  categories,
}: {
  products: CatalogItem[];
  categories: string[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "reviews">(
    "rating"
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let result = products.filter((p) => {
      const matchesCategory =
        category === "All" || p.category === category;

      const matchesSearch =
        term.length === 0 ||
        p.title.toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });

    result = result.slice().sort((a, b) => {
      if (sortBy === "rating") {
        return parseFloat(b.avg_rating) - parseFloat(a.avg_rating);
      }
      if (sortBy === "price") {
        const pa = a.price_cents ?? Infinity;
        const pb = b.price_cents ?? Infinity;
        return pa - pb; // lowest price first
      }
      if (sortBy === "reviews") {
        return b.review_count - a.review_count;
      }
      return 0;
    });

    return result;
  }, [products, search, category, sortBy]);

  return (
    <>
      {/* Controls bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product or brand…"
          style={{
            flex: "1 1 260px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
            minWidth: 160,
          }}
        >
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "rating" | "price" | "reviews")
          }
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
            minWidth: 170,
          }}
        >
          <option value="rating">Sort: Highest rating</option>
          <option value="price">Sort: Lowest price</option>
          <option value="reviews">Sort: Most reviews</option>
        </select>
      </div>

      {/* Results info */}
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        Showing {filtered.length} of {products.length} products
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            border: "1px dashed #e5e7eb",
            textAlign: "center",
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          No products match your filters. Try clearing the search or
          choosing a different category.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {filtered.map((p) => (
            <ProductCard key={String(p.id)} {...p} />
          ))}
        </div>
      )}
    </>
  );
}
