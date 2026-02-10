import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firestoreHelper";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getAllProducts();
    
    const formattedProducts = products.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand,
      category: p.category,
      priceMin_cents: p.priceMin_cents,
      priceMax_cents: p.priceMax_cents,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
