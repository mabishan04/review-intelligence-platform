// In-memory JSON-based database for products and reviews
let database: {
  products: any[];
  reviews: any[];
  initialized: boolean;
} | null = null;

export function initializeDatabase() {
  if (database && database.initialized) {
    console.log('[DB] Database already initialized');
    return;
  }

  console.log('[DB] Initializing in-memory database');

  const products = [
    { id: 1, title: 'Samsung Galaxy S10', category: 'Smartphones', price_cents: 69999 },
    { id: 2, title: 'Realme C35', category: 'Smartphones', price_cents: 14999 },
    { id: 3, title: 'Oppo F19 Pro Plus', category: 'Smartphones', price_cents: 39999 },
    { id: 4, title: 'Realme X', category: 'Smartphones', price_cents: 29999 },
    { id: 5, title: 'Oppo A57', category: 'Smartphones', price_cents: 24999 },
    { id: 6, title: 'iPhone 5s', category: 'Smartphones', price_cents: 29999 },
    { id: 7, title: 'Vivo Y20', category: 'Smartphones', price_cents: 10999 },
    { id: 8, title: 'Samsung Galaxy A12', category: 'Smartphones', price_cents: 14999 },
    { id: 9, title: 'Xiaomi Redmi 9', category: 'Smartphones', price_cents: 12999 },
    { id: 10, title: 'OnePlus 7', category: 'Smartphones', price_cents: 44999 },
    { id: 11, title: 'iPad Mini 2021', category: 'Tablets', price_cents: 49999 },
    { id: 12, title: 'Samsung Galaxy Tab', category: 'Tablets', price_cents: 29999 },
    { id: 13, title: 'Dell XPS 13', category: 'Laptops', price_cents: 149999 },
    { id: 14, title: 'HP Pavilion', category: 'Laptops', price_cents: 79999 },
    { id: 15, title: 'Lenovo IdeaPad', category: 'Laptops', price_cents: 59999 },
    { id: 16, title: 'Apple AirPods', category: 'Mobile Accessories', price_cents: 24999 },
    { id: 17, title: 'Samsung USB-C Cable', category: 'Mobile Accessories', price_cents: 999 },
  ];

  const reviews = [
    { id: 1, product_id: 1, overall_rating: 3.7, battery_rating: 3.5, performance_rating: 4.2 },
    { id: 2, product_id: 1, overall_rating: 3.8, battery_rating: 3.6, performance_rating: 4.1 },
    { id: 3, product_id: 1, overall_rating: 3.6, battery_rating: 3.4, performance_rating: 4.0 },
    { id: 4, product_id: 2, overall_rating: 3.4, battery_rating: 4.1, performance_rating: 3.2 },
    { id: 5, product_id: 2, overall_rating: 3.5, battery_rating: 4.0, performance_rating: 3.3 },
    { id: 6, product_id: 3, overall_rating: 3.5, battery_rating: 3.9, performance_rating: 3.7 },
    { id: 7, product_id: 4, overall_rating: 3.6, battery_rating: 4.0, performance_rating: 3.8 },
    { id: 8, product_id: 5, overall_rating: 4.0, battery_rating: 4.1, performance_rating: 3.9 },
    { id: 9, product_id: 5, overall_rating: 3.9, battery_rating: 4.0, performance_rating: 3.8 },
    { id: 10, product_id: 6, overall_rating: 3.5, battery_rating: 3.3, performance_rating: 3.2 },
    { id: 11, product_id: 7, overall_rating: 4.2, battery_rating: 4.3, performance_rating: 3.8 },
    { id: 12, product_id: 8, overall_rating: 3.3, battery_rating: 3.4, performance_rating: 3.1 },
    { id: 13, product_id: 9, overall_rating: 3.8, battery_rating: 3.9, performance_rating: 3.6 },
    { id: 14, product_id: 10, overall_rating: 4.1, battery_rating: 4.0, performance_rating: 4.3 },
    { id: 15, product_id: 11, overall_rating: 4.3, battery_rating: 4.4, performance_rating: 4.1 },
    { id: 16, product_id: 12, overall_rating: 3.9, battery_rating: 3.8, performance_rating: 3.9 },
    { id: 17, product_id: 13, overall_rating: 4.6, battery_rating: 4.5, performance_rating: 4.7 },
    { id: 18, product_id: 14, overall_rating: 4.0, battery_rating: 3.9, performance_rating: 4.1 },
    { id: 19, product_id: 15, overall_rating: 3.8, battery_rating: 3.7, performance_rating: 3.9 },
  ];

  database = {
    products,
    reviews,
    initialized: true,
  };

  console.log('[DB] Database initialized with', products.length, 'products and', reviews.length, 'reviews');
}

export function getProducts(filters: {
  budget?: number;
  category?: string;
  limit?: number;
}): any[] {
  if (!database) initializeDatabase();

  let result = database!.products;

  // Filter by budget
  if (filters.budget) {
    result = result.filter((p) => p.price_cents <= filters.budget!);
  }

  // Filter by category
  if (filters.category && filters.category !== 'All Categories') {
    result = result.filter(
      (p) => p.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  // Enrich with review data
  const enriched = result.map((p) => {
    const productReviews = database!.reviews.filter((r) => r.product_id === p.id);
    const avgRating =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + r.overall_rating, 0) / productReviews.length
        : 0;
    const avgBattery =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + (r.battery_rating || 0), 0) / productReviews.length
        : null;
    const avgPerformance =
      productReviews.length > 0
        ? productReviews.reduce((sum, r) => sum + (r.performance_rating || 0), 0) / productReviews.length
        : null;

    return {
      ...p,
      avg_rating: avgRating,
      review_count: productReviews.length,
      battery_rating: avgBattery,
      performance_rating: avgPerformance,
    };
  });

  // Sort by review count desc, then rating desc
  enriched.sort((a, b) => {
    if (b.review_count !== a.review_count) {
      return b.review_count - a.review_count;
    }
    return b.avg_rating - a.avg_rating;
  });

  // Limit results
  return enriched.slice(0, filters.limit || 50);
}

export function getCategories(): string[] {
  if (!database) initializeDatabase();

  const categories = [...new Set(database!.products.map((p) => p.category))].sort();
  return ['All Categories', ...categories];
}
