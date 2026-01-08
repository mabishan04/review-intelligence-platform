import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const result = await pool.query(`
    select id, title, brand, category, price_cents
    from products
    order by id asc
  `);

  return NextResponse.json({ products: result.rows });
}
