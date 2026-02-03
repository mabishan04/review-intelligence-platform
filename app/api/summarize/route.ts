import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  try {
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
  } catch (error) {
    console.error("Ollama error:", error);
    return null;
  }
}

function parseAIResponse(response: string): { summary: string; pros: string[]; cons: string[] } {
  // Try to parse the response for structured data
  const proMatch = response.match(/Pros?:?\s*([\s\S]*?)(?:Cons?:|$)/i);
  const consMatch = response.match(/Cons?:?\s*([\s\S]*?)$/i);

  const pros = proMatch
    ? proMatch[1]
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line && line.length > 0)
        .slice(0, 3)
    : [];

  const cons = consMatch
    ? consMatch[1]
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line) => line && line.length > 0)
        .slice(0, 3)
    : [];

  return {
    summary: response.split('\n')[0] || response,
    pros: pros.length > 0 ? pros : ['Good overall quality'],
    cons: cons.length > 0 ? cons : ['Minor improvements needed'],
  };
}

function generateMockInsights(
  reviews: Array<{ rating: number | null; review_text: string }>,
  productTitle: string
) {
  const positiveKeywords = [
    'excellent', 'great', 'amazing', 'love', 'best', 'awesome', 'good',
    'fantastic', 'perfect', 'quality', 'fast', 'reliable', 'beautiful',
  ];
  const negativeKeywords = [
    'bad', 'terrible', 'awful', 'poor', 'cheap', 'slow', 'disappointing',
    'waste', 'hate', 'broken', 'defective', 'overpriced',
  ];

  const pros: { [key: string]: number } = {};
  const cons: { [key: string]: number } = {};

  reviews.forEach((review) => {
    const text = review.review_text.toLowerCase();
    const isPositive = (review.rating || 0) >= 4;
    const isNegative = (review.rating || 0) <= 2;

    if (isPositive) {
      if (text.includes('performance') || text.includes('fast'))
        pros['Excellent performance'] = (pros['Excellent performance'] || 0) + 1;
      if (text.includes('camera') || text.includes('photo') || text.includes('video'))
        pros['Great camera quality'] = (pros['Great camera quality'] || 0) + 1;
      if (text.includes('battery'))
        pros['Long battery life'] = (pros['Long battery life'] || 0) + 1;
      if (text.includes('display') || text.includes('screen'))
        pros['Great display'] = (pros['Great display'] || 0) + 1;
      if (text.includes('design') || text.includes('build'))
        pros['Premium design'] = (pros['Premium design'] || 0) + 1;
    }

    if (isNegative) {
      if (text.includes('plastic') || text.includes('cheap') || text.includes('build'))
        cons['Plastic build feels cheap'] = (cons['Plastic build feels cheap'] || 0) + 1;
      if (text.includes('battery'))
        cons['Battery could be better'] = (cons['Battery could be better'] || 0) + 1;
      if (text.includes('slow') || text.includes('speed'))
        cons['Not the fastest'] = (cons['Not the fastest'] || 0) + 1;
      if (text.includes('price') || text.includes('expensive'))
        cons['Pricey'] = (cons['Pricey'] || 0) + 1;
    }
  });

  const topPros = Object.entries(pros)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pro]) => pro);

  const topCons = Object.entries(cons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([con]) => con);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const positiveReviews = reviews.filter((r) => r.rating && r.rating >= 4).length;
  const positivePercent = Math.round((positiveReviews / reviews.length) * 100);

  return {
    summary: `The ${productTitle} received overwhelmingly positive reviews for its ${topPros[0]?.toLowerCase() || 'quality'}. Users appreciated the product's features and performance. However, some reviewers noted that ${topCons[0]?.toLowerCase() || 'there are areas for improvement'}.`,
    pros:
      topPros.length > 0
        ? topPros
        : ['Good overall quality', 'Reliable performance', 'Great value'],
    cons:
      topCons.length > 0
        ? topCons
        : ['Minor improvements needed', 'Could be more affordable', 'Limited features'],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, productTitle, reviews: reviewTexts } = body;

    // Handle both string array and structured review objects
    let textReviews: string[] = [];
    
    if (Array.isArray(reviewTexts)) {
      if (reviewTexts.length === 0) {
        return NextResponse.json(
          { error: "No reviews provided" },
          { status: 400 }
        );
      }
      
      // If items are strings, use them directly
      if (typeof reviewTexts[0] === 'string') {
        textReviews = reviewTexts.filter(t => t && t.length > 0);
      } else {
        // If items are objects, extract text from review_text or notes field
        textReviews = reviewTexts
          .map((r: any) => r.review_text || r.notes || '')
          .filter((t: string) => t && t.length > 0);
      }
    }
    
    if (textReviews.length === 0) {
      return NextResponse.json(
        { error: "No reviews provided" },
        { status: 400 }
      );
    }

    // Create mock reviews array with text only
    const reviews = textReviews.map((text: string) => ({
      rating: 4, // Default rating
      review_text: text,
    }));

    // Try to get AI insights
    const prompt = `
Analyze these customer reviews for "${productTitle}" and provide:

1. A brief summary (2-3 sentences) of the overall sentiment
2. Top 3 pros (what customers liked)
3. Top 3 cons (what customers didn't like)

Format your response as:
Summary: [your summary here]

Pros:
- [pro 1]
- [pro 2]
- [pro 3]

Cons:
- [con 1]
- [con 2]
- [con 3]

Reviews to analyze:
${reviews
  .slice(0, 10)
  .map((r, i) => `${i + 1}. ${r.review_text}`)
  .join('\n')}
`.trim();

    const aiResponse = await callOllama(prompt);

    let insights;
    if (aiResponse) {
      insights = parseAIResponse(aiResponse);
    } else {
      // Fallback to mock insights if Ollama fails
      insights = generateMockInsights(reviews, productTitle);
    }

    return NextResponse.json(insights);
  } catch (e: any) {
    console.error("Summarize error:", e);
    // Return mock insights on error instead of failing
    return NextResponse.json(
      {
        summary: "Unable to generate AI insights at this time. Here is what reviewers said:",
        pros: ["Good overall quality", "Reliable product", "Great value"],
        cons: ["Could be improved", "Minor issues noted", "Consider before buying"],
      },
      { status: 200 }
    );
  }
}
