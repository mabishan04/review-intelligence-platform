import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type IngestBody = {
  product: {
    title: string;
    brand?: string;
    category: string;
    price_cents?: number;
    product_url?: string;
    image_url?: string;
  };
  reviews: Array<{
    rating?: number;
    source?: string;
    review_text: string;
  }>;
};

export async function POST(req: Request) {
  const body = (await req.json()) as IngestBody;

  if (!body?.product?.title || !body?.product?.category) {
    return NextResponse.json({ error: "Missing product title/category" }, { status: 400 });
  }
  if (!Array.isArray(body.reviews) || body.reviews.length === 0) {
    return NextResponse.json({ error: "Provide at least 1 review" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const p = body.product;

    const productRes = await client.query(
      `insert into products (title, brand, category, price_cents, product_url, image_url)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [
        p.title,
        p.brand ?? null,
        p.category,
        Number.isFinite(p.price_cents) ? p.price_cents : null,
        p.product_url ?? null,
        p.image_url ?? null,
      ]
    );

    const productId = productRes.rows[0].id;

    for (const r of body.reviews) {
      if (!r?.review_text) continue;
      const rating =
        typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5 ? r.rating : null;

      await client.query(
        `insert into reviews (product_id, rating, source, review_text)
         values ($1, $2, $3, $4)`,
        [productId, rating, r.source ?? "ingest", r.review_text]
      );
    }

    await client.query("commit");

    return NextResponse.json({ ok: true, productId });
  } catch (e: any) {
    await client.query("rollback");
    return NextResponse.json({ error: "Ingest failed", details: String(e?.message ?? e) }, { status: 500 });
  } finally {
    client.release();
  }
}
