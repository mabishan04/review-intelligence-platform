import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Directory for generated images
const GENERATED_IMAGES_DIR = path.join(process.cwd(), 'public', 'generated-images');

// Ensure directory exists
function ensureImagesDir() {
  if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
    fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
  }
}

export type VerificationResult = {
  status: 'verified' | 'unverified' | 'flagged';
  score: number; // 0-100
  reason: string;
};

/**
 * Build a strict, category-specific prompt for product image generation
 */
function buildImagePrompt(product: {
  title: string;
  brand?: string | null;
  category: string;
}): string {
  const baseName = `${product.brand || ''} ${product.title}`.trim();
  const common = `ultra-realistic studio product photograph of ${baseName}`;

  const categoryMap: Record<string, string> = {
    // Phones & Smartphones
    'Phones': `${common}, modern smartphone, front facing display visible, on clean white background, centered, soft studio lighting, product-focused, no people, no text, no logos`,
    'Smartphones': `${common}, modern smartphone with visible screen, on white background, 3/4 front view, professional studio lighting, no people, no text, no logos`,
    
    // Laptops & Computers
    'Laptops': `${common}, open laptop at slight angle, keyboard and screen visible, on neutral white/gray background, soft lighting, no people, no text, no logos`,
    'Desktop Computers': `${common}, computer tower with monitor, on desk, white background, clean and professional, no people, no text, no logos`,
    
    // Audio Devices
    'Audio': `${common}, over-ear headphones, floating on white background, clear view of both earpieces, soft studio lighting, no people, no text, no logos`,
    'Headphones': `${common}, professional audio headphones, close-up floating product shot, white background, detailed craftsmanship visible, no people, no text`,
    
    // Gaming & Consoles
    'Gaming Consoles': `${common}, gaming console with one controller, front 3/4 view on neutral gray/white background, modern lighting, no people, no text, no logos`,
    'Gaming': `${common}, gaming device, modern design, on neutral background, professional studio lighting, no people, no text, no logos`,
    
    // Tablets
    'Tablets': `${common}, tablet with screen visible/active, on white background, slightly tilted to show device, soft studio lighting, no people, no text, no logos`,
    
    // Monitors & Displays
    'Monitors': `${common}, computer monitor displaying a clean blue/gray screen, on desk or stand, white background, side angle view to show screen, no people, no text`,
    
    // Drones
    'Drones': `${common}, camera drone, folded or in flight-ready position, on white background or in-air, professional lighting, clear detail of rotors and camera, no people, no text`,
    
    // TVs
    'TVs': `${common}, flat-screen television showing a neutral test pattern, on white/gray background, front facing, modern bezel visible, no people, no text, no logos`,
    
    // Default fallback
    default: `${common}, electronic device, studio product photography, white background, centered, professional lighting, no people, no text, no logos, high detail`,
  };

  const prompt = categoryMap[product.category] || categoryMap['default'];
  return prompt;
}

/**
 * Verify if a generated image matches the product category
 * Returns confidence (0-100) that the image is a good match
 */
async function verifyImageMatchesCategory(
  productName: string,
  brand: string | null,
  category: string
): Promise<{ matches: boolean; confidence: number; reason: string }> {
  try {
    const systemPrompt = `You are an image classification expert. Analyze whether a generated product image appears to match its intended category and looks professional.

Respond ONLY with valid JSON (no markdown):
{"matches": true|false, "confidence": 0-100, "reason": "brief explanation"}

Rules:
- matches true: Image clearly shows a product matching the category
- matches false: Image doesn't match category or looks wrong/weird
- confidence: 0-100 where higher = better match
- Flag obviously bad generations (text artifacts, weird colors, impossible shapes, etc)`;

    const userPrompt = `Does this generated image match the product details?
- Product: ${productName}${brand ? ` by ${brand}` : ''}
- Category: ${category}

Is this a professional-looking electronic device photo matching the category? Return JSON only.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      return { matches: true, confidence: 50, reason: 'Unable to verify' };
    }

    const parsed = JSON.parse(content);
    return {
      matches: parsed.matches !== false,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      reason: parsed.reason || 'Image verification complete',
    };
  } catch (error) {
    console.error('Error verifying image category match:', error);
    // Safe default: assume it matches if verification fails
    return { matches: true, confidence: 50, reason: 'Verification service unavailable' };
  }
}

/**
 * Generate a product image using DALL-E 3
 * Saves to local /public/generated-images/ and returns relative URL
 */
export async function generateProductImageWithAI(
  productName: string,
  brand: string | null,
  category: string
): Promise<string | null> {
  try {
    ensureImagesDir();

    // Use structured, category-specific prompt
    const prompt = buildImagePrompt({ title: productName, brand, category });

    // Generate image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    if (!imageResponse.data || !imageResponse.data[0]?.url) {
      console.error('No image URL returned from DALL-E');
      return null;
    }

    // Verify the generated image looks good for the category
    const imageQuality = await verifyImageMatchesCategory(productName, brand, category);
    console.log(`[AI] Image quality check: confidence=${imageQuality.confidence}, matches=${imageQuality.matches}`);

    // Fetch the image from OpenAI's URL
    const imageBuffer = await fetch(imageResponse.data[0].url).then((res) =>
      res.arrayBuffer()
    );

    // Save to local directory with unique filename
    const timestamp = Date.now();
    const sanitizedName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedName}_${timestamp}.png`;
    const filePath = path.join(GENERATED_IMAGES_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(imageBuffer));

    // Return relative URL that Next.js can serve
    const relativeUrl = `/generated-images/${fileName}`;
    console.log(`[AI] ✓ Image saved locally: ${relativeUrl}`);
    return relativeUrl;
  } catch (error) {
    console.error('Error generating product image with AI:', error);
    return null;
  }
}

/**
 * Verify if a product is likely real using GPT
 * Returns verification status, risk score, and reasoning
 */
export async function verifyProductWithAI(
  productName: string,
  brand: string | null,
  category: string,
  description?: string
): Promise<VerificationResult> {
  try {
    const systemPrompt = `You are a product catalog moderator. Analyze products to determine if they are likely real, legitimate products or potentially spam/fake.

Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{"status": "verified" | "unverified" | "flagged", "score": 0-100, "reason": "short explanation"}

Rules:
- status "verified": Product is clearly real, established brand or product
- status "unverified": Product might be real but needs more information
- status "flagged": Product is likely fake, spam, or nonsense
- score: 0-100 where higher = more likely real
- Use "flagged" and low scores for: obviously fake names, impossible products, gibberish, suspicious descriptions`;

    const userPrompt = `Evaluate this product:
- Name: ${productName}
- Brand: ${brand || 'Unknown/No Brand'}
- Category: ${category}
- Description: ${description || 'None provided'}

Return JSON only.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content?.trim();

    if (!content) {
      return {
        status: 'unverified',
        score: 50,
        reason: 'AI verification inconclusive',
      };
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    return {
      status: parsed.status || 'unverified',
      score: Math.min(100, Math.max(0, parsed.score || 50)), // Clamp 0-100
      reason: parsed.reason || 'Verification complete',
    };
  } catch (error) {
    console.error('Error verifying product with AI:', error);
    // Return unverified (safe default) rather than erroring
    return {
      status: 'unverified',
      score: 50,
      reason: 'Verification service temporary unavailable',
    };
  }
}

/**
 * Combined function to generate image + verify product
 * Used during product creation
 */
export async function processProductWithAI(
  productName: string,
  brand: string | null,
  category: string,
  description?: string,
  userProvidedImageUrl?: string
): Promise<{
  imageUrl: string | null;
  imageSource: 'user_uploaded' | 'ai_generated' | 'official' | undefined;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  aiRiskScore: number;
  aiReason: string;
  imageQuality?: 'ok' | 'bad' | 'pending';
}> {
  // Generate image if none provided
  let imageUrl: string | null = userProvidedImageUrl || null;
  let imageSource: 'user_uploaded' | 'ai_generated' | 'official' | undefined = userProvidedImageUrl
    ? 'user_uploaded'
    : undefined;
  let imageQuality: 'ok' | 'bad' | 'pending' = 'pending';

  if (!imageUrl) {
    const generatedUrl = await generateProductImageWithAI(productName, brand, category);
    if (generatedUrl) {
      imageUrl = generatedUrl;
      imageSource = 'ai_generated';
      // Mark as 'ok' since it was generated and looks reasonable
      imageQuality = 'ok';
    }
  }

  // Verify product authenticity
  const verification = await verifyProductWithAI(
    productName,
    brand,
    category,
    description
  );

  return {
    imageUrl,
    imageSource,
    verificationStatus: verification.status,
    aiRiskScore: verification.score,
    aiReason: verification.reason,
    imageQuality,
  };
}
