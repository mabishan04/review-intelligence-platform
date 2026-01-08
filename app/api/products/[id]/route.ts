import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idStr = url.pathname.split("/").pop();
  const id = Number(idStr);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const productRes = await pool.query(
    `select id, title, brand, category, price_cents
     from products
     where id = $1`,
    [id]
  );

  if (productRes.rowCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reviewsRes = await pool.query(
    `select id, rating, source, review_text, created_at
     from reviews
     where product_id = $1
     order by id asc`,
    [id]
  );

  return NextResponse.json({
    product: productRes.rows[0],
    reviews: reviewsRes.rows,
  });
}
