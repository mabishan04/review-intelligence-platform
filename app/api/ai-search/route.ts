import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAllProducts, getProductStats } from "@/lib/mockData";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type CatalogForAI = {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  price: number | null;
  avgRating: number;
  reviewCount: number;
};

type AISearchPayload = {
  query: string;
  explanation: string;
  topPicks: {
    productId: string;
    name: string;
    brand: string | null;
    matchScore: number;
    reason: string;
  }[];
};

// Build a compact catalog description for the model
function buildCatalogForAI(): CatalogForAI[] {
  const products = getAllProducts();

  const catalog: CatalogForAI[] = products.map((p) => {
    const stats = getProductStats(p.id);
    return {
      id: p.id,
      title: p.title,
      brand: p.brand ?? null,
      category: p.category,
      price: p.price_cents != null ? p.price_cents / 100 : null,
      avgRating: Number(stats.avgRating || "0"),
      reviewCount: stats.count,
    };
  });

  // sort by rating then review count so the "best" items are near the top
  catalog.sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.reviewCount - a.reviewCount;
  });

  // keep it small for the prompt
  return catalog.slice(0, 40);
}

function buildFallbackResponse(query: string): AISearchPayload {
  const catalog = buildCatalogForAI().slice(0, 5);

  return {
    query,
    explanation:
      "The AI service is temporarily unavailable, so here are some highly rated products based on basic ratings and review counts.",
    topPicks: catalog.map((p) => ({
      productId: p.id,
      name: p.title,
      brand: p.brand,
      matchScore: Math.round(p.avgRating * 20),
      reason: `Average rating ${p.avgRating.toFixed(
        1
      )} from ${p.reviewCount} reviews.`,
    })),
  };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return NextResponse.json(
      { message: "Query is required" },
      { status: 400 }
    );
  }

  // Safety net: reject queries that are too vague
  const wordCount = query.split(/\s+/).length;
  if (wordCount < 3) {
    return NextResponse.json({
      query,
      explanation:
        "Please provide a short description of what you're looking for (at least 3 words) so I can help you find the right product.",
      topPicks: [],
    });
  }

  const catalog = buildCatalogForAI();
  const catalogStr = catalog
    .map(
      (p) =>
        `ID: ${p.id} | ${p.title} (${p.brand}) | ${p.category} | $${p.price || "N/A"} | ⭐${p.avgRating} (${p.reviewCount} reviews)`
    )
    .join("\n");

  const systemPrompt = `You are an expert product recommender. A user describes what they're looking for, and you recommend the best products from our catalog that match their needs.

Return ONLY valid JSON in this exact format:
{
  "query": "user's query here",
  "explanation": "brief explanation of your reasoning",
  "topPicks": [
    { "productId": "id", "matchScore": 85 },
    { "productId": "id", "matchScore": 80 },
    { "productId": "id", "matchScore": 75 }
  ]
}

Pick up to 3 best matches. matchScore is 0-100.`;

  const userPrompt = `Here is our product catalog:

${catalogStr}

The user is looking for: "${query}"

Recommend the best 3 products from the catalog that match their request. Return ONLY the JSON, no other text.`;

  try {
    console.log("AI SEARCH → Calling OpenAI with query:", query);
    console.log("AI SEARCH → API Key present:", !!process.env.OPENAI_API_KEY);

    const message = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    console.log("AI SEARCH → Response received:", { choices: message.choices?.length });

    let jsonStr =
      message.choices[0]?.message?.content || "{}";

    console.log("AI SEARCH → OpenAI raw response:", jsonStr);

    // Clean up markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn("Failed to parse AI response, using fallback:", jsonStr, parseErr);
      return NextResponse.json(buildFallbackResponse(query));
    }

    const topPicks = Array.isArray(parsed.topPicks) ? parsed.topPicks : [];

    // Enrich with full product data
    const enriched = topPicks
      .map((pick: any) => {
        const product = catalog.find((p) => p.id === pick.productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.title,
          brand: product.brand,
          matchScore: pick.matchScore || 0,
          reason: pick.reason || `Matched your search for "${query}"`,
        };
      })
      .filter(Boolean);

    console.log("AI SEARCH → Success! Enriched picks:", enriched.length);

    return NextResponse.json({
      query,
      explanation: parsed.explanation || "AI-powered recommendation",
      topPicks: enriched,
    } as AISearchPayload);
  } catch (err: any) {
    console.error("[ai-search] CATCH BLOCK Error:", {
      message: err?.message,
      code: err?.code,
      status: err?.status,
      fullError: err,
    });
    console.log("[ai-search] → Returning fallback response");
    return NextResponse.json(buildFallbackResponse(query));
  }
}
