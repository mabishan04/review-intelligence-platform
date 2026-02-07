import HeroSection from "./components/HeroSection";
import ShoppingAssistantWrapper from "./components/ShoppingAssistantWrapper";
import ProductCard from "./components/ProductCard";
import ViewAllButton from "./components/ViewAllButton";
import HomeProductFormSection from "./components/HomeProductFormSection";

type CatalogItem = {
  id: number;
  title: string;
  brand: string | null;
  category: string;
  priceMin_cents: number | null;
  priceMax_cents: number | null;
  avg_rating: string;
  review_count: number;
};

async function getCatalog(): Promise<CatalogItem[]> {
  try {
    const res = await fetch("http://localhost:3000/api/catalog", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("API unavailable");
    }
    const data = await res.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error("Invalid data");
    }
    return data.products;
  } catch (error) {
    // Silently use demo data
    return [
      {
        id: 1,
        title: "MacBook Pro 14-inch",
        brand: "Apple",
        category: "Laptops",
        priceMin_cents: 169999,
        priceMax_cents: 219999,
        avg_rating: "4.8",
        review_count: 2840,
      },
      {
        id: 2,
        title: "Dell XPS 13",
        brand: "Dell",
        category: "Laptops",
        priceMin_cents: 89999,
        priceMax_cents: 119999,
        avg_rating: "4.6",
        review_count: 1920,
      },
      {
        id: 3,
        title: "iPhone 15 Pro",
        brand: "Apple",
        category: "Phones",
        priceMin_cents: 99999,
        priceMax_cents: 119999,
        avg_rating: "4.7",
        review_count: 5620,
      },
      {
        id: 4,
        title: "Samsung Galaxy S24",
        brand: "Samsung",
        category: "Phones",
        priceMin_cents: 79999,
        priceMax_cents: 99999,
        avg_rating: "4.5",
        review_count: 3440,
      },
      {
        id: 5,
        title: "Sony WH-1000XM5",
        brand: "Sony",
        category: "Headphones",
        priceMin_cents: 34999,
        priceMax_cents: 39999,
        avg_rating: "4.9",
        review_count: 4120,
      },
      {
        id: 6,
        title: "iPad Pro 12.9",
        brand: "Apple",
        category: "Tablets",
        priceMin_cents: 99999,
        priceMax_cents: 129999,
        avg_rating: "4.8",
        review_count: 2250,
      },
      {
        id: 7,
        title: "Samsung Galaxy Tab S9",
        brand: "Samsung",
        category: "Tablets",
        priceMin_cents: 69999,
        priceMax_cents: 89999,
        avg_rating: "4.4",
        review_count: 1680,
      },
      {
        id: 8,
        title: "Google Pixel 8 Pro",
        brand: "Google",
        category: "Phones",
        priceMin_cents: 89999,
        priceMax_cents: 109999,
        avg_rating: "4.6",
        review_count: 2980,
      },
    ];
  }
}

async function getCategories(): Promise<string[]> {
  const products = await getCatalog();
  const cats = new Set(products.map(p => p.category));
  return Array.from(cats).sort();
}

export default async function Home() {
  const products = await getCatalog();
  const categories = await getCategories();

  return (
    <>
      <HeroSection />
      
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* List a Product section - only visible to signed-in users */}
        <HomeProductFormSection />

        {/* Featured Products section */}
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
          Featured Products
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 48, fontSize: 16 }}>
          Handpicked products ranked by reviews and ratings
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 64 }}>
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <ViewAllButton />
        </div>
      </main>
    </>
  );
}
