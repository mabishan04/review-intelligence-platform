import fs from "fs";
import readline from "readline";

const API = "http://localhost:3000/api/ingest";

// change these as needed
const INPUT_PATH = "data/reviews.jsonl";
const MAX_PRODUCTS = 200;     // cap products
const MAX_REVIEWS = 1000;     // cap reviews total

function safeStr(x) {
  if (x == null) return "";
  return String(x).trim();
}

function toCents(price) {
  const n = Number(price);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Missing file: ${INPUT_PATH}`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT_PATH),
    crlfDelay: Infinity,
  });

  // group reviews by a "product key"
  const byProduct = new Map(); // key -> { product, reviews[] }

  let totalReviews = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    // try multiple common field names used by datasets
    const asin = safeStr(row.asin);
    if (!asin) continue;

    const title = `Amazon Product ${asin}`;
    const brand = undefined;
    const category = "electronics";

    const rating = Number(row.overall);
    const review_text = safeStr([row.summary, row.reviewText].filter(Boolean).join(". "));

    if (!review_text) continue;
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;

    const key = asin;


    if (!byProduct.has(key)) {
      if (byProduct.size >= MAX_PRODUCTS) continue;

      byProduct.set(key, {
        product: {
          title,
          brand: brand || undefined,
          category,
        },
        reviews: [],
      });
    }

    const bucket = byProduct.get(key);
    bucket.reviews.push({
      rating,
      source: safeStr(row.source || row.site || "dataset") || "dataset",
      review_text,
    });

    totalReviews++;
    if (totalReviews >= MAX_REVIEWS) break;
  }

  console.log(`Prepared ${byProduct.size} products and ~${totalReviews} reviews`);

  let importedProducts = 0;

  for (const [, entry] of byProduct) {
    // limit per product so one product doesn't take all reviews
    const reviews = entry.reviews.slice(0, 25);

    try {
      const res = await postJSON(API, { product: entry.product, reviews });
      importedProducts++;
      console.log(`Imported productId=${res.productId} (${importedProducts}/${byProduct.size})`);
    } catch (e) {
      console.error("Import failed:", e.message);
    }
  }

  console.log("Done.");
}

main();
