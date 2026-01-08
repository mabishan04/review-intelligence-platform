import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const result = await pool.query(`
    select
      p.id,
      p.title,
      p.brand,
      p.category,
      p.price_cents,
      coalesce(avg(r.rating), 0)::numeric(10,2) as avg_rating,
      count(r.id)::int as review_count
    from products p
    left join reviews r on r.product_id = p.id
    group by p.id
    order by review_count desc, avg_rating desc, p.id asc
  `);

  return NextResponse.json({ products: result.rows });
}
