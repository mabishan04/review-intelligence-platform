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

function parseAIResponse(response: string): { summary: string; pros: string[]; cons: string[]; bestFor?: string } {
  // Try to parse the response for structured data
  const summaryMatch = response.match(/Summary:\s*([\s\S]*?)(?:Strengths:|Pros?:|$)/i);
  const strengthsMatch = response.match(/Strengths:\s*([\s\S]*?)(?:Weaknesses:|Cons?:|$)/i);
  const weaknessesMatch = response.match(/Weaknesses:\s*([\s\S]*?)(?:Best For:|$)/i);
  const bestForMatch = response.match(/Best For:\s*([\s\S]*?)$/i);

  const parsePart = (text: string): string[] => {
    return text
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line) => line && line.length > 0 && !line.startsWith('['));
      // Get all items, don't force slice(0, 3)
  };

  const pros = strengthsMatch ? parsePart(strengthsMatch[1]) : [];
  const cons = weaknessesMatch ? parsePart(weaknessesMatch[1]) : [];
  const bestFor = bestForMatch ? bestForMatch[1].trim().split('\n')[0] : undefined;
  const summary = summaryMatch ? summaryMatch[1].trim().split('\n')[0] : response.split('\n')[0];

  return {
    summary: summary || response,
    pros: pros.length > 0 ? pros : ['Reliable and functional', 'Decent value', 'Gets the job done'],
    cons: cons.length > 0 ? cons : ['Room for improvement in some areas', 'Not perfect for all use cases', 'Some tradeoffs to consider'],
    bestFor,
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

    // Extract avgRating from body to adjust prompt
    const avgRating = body.avgRating || 3.5;
    const isLowRated = avgRating < 2.5;
    const isMidRated = avgRating >= 2.5 && avgRating < 4.2;
    const isHighRated = avgRating >= 4.2;

    // Adjust strength/weakness counts based on rating
    // High-rated: show MORE strengths, FEWER weaknesses
    // Mid-rated: BALANCED on both sides
    // Low-rated: show FEWER strengths, MORE weaknesses
    let strengthsFormat = "- [what customers loved - be specific]\n- [recurring positive theme]\n- [key advantage mentioned]";
    let weaknessesFormat = "- [main complaint or issue]\n- [recurring concern]";

    if (isLowRated) {
      // Bad product: 1 strength, 3 weaknesses
      strengthsFormat = "- [any notable positive aspect, if applicable]";
      weaknessesFormat = "- [main complaint or issue]\n- [recurring concern]\n- [major limitation or significant tradeoff]";
    } else if (isMidRated) {
      // Mid product: 2 strengths, 2 weaknesses
      strengthsFormat = "- [what customers liked]\n- [another positive aspect]";
      weaknessesFormat = "- [main complaint or issue]\n- [recurring concern]";
    } else if (isHighRated) {
      // High-rated: 3 strengths, 1 weakness - heavily weighted toward quality
      strengthsFormat = "- [what customers loved - be specific]\n- [recurring positive theme]\n- [key advantage mentioned]";
      weaknessesFormat = "- [any minor limitation or tradeoff, if applicable]";
    }

    // Try to get AI insights
    const prompt = `You are a product review analyst. Analyze these customer reviews for "${productTitle}" and provide clear, easy-to-understand insights without using percentages or numbers.

TASK:
1. Write a natural summary (2-3 sentences) capturing the overall customer sentiment and main themes
2. List the strengths that customers consistently praised
3. List the weaknesses or concerns customers mentioned
4. Briefly describe who this product is best suited for

Keep the language simple and accessible - imagine explaining this to a friend.
Avoid statistics, percentages, or numerical comparisons.
Focus on what actually matters to customers.

Format:
Summary: [natural language summary of overall feedback]

Strengths:
${strengthsFormat}

Weaknesses:
${weaknessesFormat}

Best For:
[1-2 sentences describing ideal customer type and use case]

Customer Feedback:
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
      const mockInsights = generateMockInsights(reviews, productTitle);
      insights = {
        ...mockInsights,
        bestFor: `Users who prioritize ${mockInsights.pros[0]?.toLowerCase() || 'quality and reliability'}`
      };
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
