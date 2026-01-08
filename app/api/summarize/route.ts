import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  const r = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.2 },
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Ollama error ${r.status}: ${text}`);
  }

  const data = await r.json();
  return String(data.response || "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = Number(body?.productId);

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const productRes = await pool.query(
      `select id, title, category
       from products
       where id = $1`,
      [productId]
    );

    if (productRes.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviewsRes = await pool.query(
      `select rating, review_text
       from reviews
       where product_id = $1
       order by id asc
       limit 40`,
      [productId]
    );

    if (reviewsRes.rowCount === 0) {
      return NextResponse.json({ error: "No reviews for this product" }, { status: 404 });
    }

    const product = productRes.rows[0];
    const reviews = reviewsRes.rows;

    const prompt = `
You are summarizing customer reviews for a product.

Product: ${product.title} (${product.category})

Write a concise summary in 3-5 sentences:
- mention the most common praises
- mention the most common complaints
- overall sentiment
No bullets. No headings. Plain text only.

Reviews:
${reviews.map((r: any, i: number) => `${i + 1}. (${r.rating ?? "?"}/5) ${r.review_text}`).join("\n")}
`.trim();

    const summary = await callOllama(prompt);

    await pool.query(
      `update products set review_summary = $1 where id = $2`,
      [summary, productId]
    );

    return NextResponse.json({ ok: true, productId, summary });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Summarize failed", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
