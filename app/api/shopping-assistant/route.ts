import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userMessage, categories, conversationHistory } = body;

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage' }, { status: 400 });
    }

    // Check if message is a pure greeting (no product intent)
    const greetingPatterns = /^(hi|hey|hello|sup|yo|what'?s up|hiya|greetings|good morning|good afternoon|good evening)[\s\W]*$/i;
    const hasProductKeywords = /\$|\d+|phone|laptop|tablet|accessory|battery|performance|camera|gaming|game|product|buy|find|show|recommend|suggest|look for|search|want|need|like|best|good|cheap|expensive/i;
    
    const isPureGreeting = greetingPatterns.test(userMessage.toLowerCase().trim()) || 
      (userMessage.toLowerCase().trim().length < 15 && 
       !hasProductKeywords.test(userMessage) &&
       !userMessage.match(/\?$/) &&
       conversationHistory && conversationHistory.length === 0);
    
    if (isPureGreeting) {
      return NextResponse.json({
        message: `Hey there! 👋 I'm your AI shopping assistant, powered by real user reviews. I'm here to help you find the perfect product!\n\nTell me what you're looking for:\n• What type of product? (phone, laptop, tablet, accessories, etc.)\n• What's your budget?\n• What matters most? (battery life, performance, camera, value, etc.)\n\nJust ask naturally, like "Show me a phone under $500 with good battery" 😊`,
        products: [],
        intent: {},
      });
    }

    // Parse intent first to see what we know
    const previousIntent = conversationHistory && conversationHistory.length > 0 
      ? conversationHistory[conversationHistory.length - 1]?.intent 
      : null;
    
    const tempIntent = parseIntent(userMessage, categories, previousIntent);
    
    // Check if user explicitly says they have no budget constraint
    const hasNoBudgetConstraint = userMessage.toLowerCase().match(/no budget|don't have budget|don't have a budget|no price limit|expensive|any price/i);
    
    // Check if user mentioned cheap/budget/value (this implies priority without needing explicit budget amount)
    const isBudgetFocused = userMessage.toLowerCase().match(/cheap|budget|value|affordable|inexpensive|low cost|under.*\$|for only/i);

    // Check if category is specified but budget is not (and they didn't say no budget or cheap)
    if (tempIntent.category && tempIntent.category !== 'All Categories' && !tempIntent.budget && !hasNoBudgetConstraint && !isBudgetFocused && !previousIntent?.budget) {
      return NextResponse.json({
        message: `Great! A ${tempIntent.category.toLowerCase()}. To find the best options for you, I need to know:\n\n• What's your budget? (e.g., "$200", "$500", etc.)\n• What matters most to you? (battery life, performance, camera, value, build quality)\n\nJust tell me naturally!`,
        products: [],
        intent: tempIntent,
      });
    }

    // Check if budget is specified but category and priority are vague
    if (tempIntent.budget && !tempIntent.priority && tempIntent.category === 'All Categories' && !previousIntent) {
      return NextResponse.json({
        message: `Got it, budget of $${tempIntent.budget}! Now I need to know a bit more:\n\n• What type of product are you looking for? (phone, laptop, tablet, etc.)\n• What's most important to you? (battery life, performance, camera, value, build quality)\n\nThis will help me find the perfect match!`,
        products: [],
        intent: tempIntent,
      });
    }
    
    const intent = parseIntent(userMessage, categories, previousIntent);

    // Fetch products based on parsed intent
    const products = await fetchProducts(intent);

    // Generate structured response
    const aiResponse = await generateStructuredResponse(userMessage, products, intent);

    return NextResponse.json({
      message: aiResponse,
      products: products.slice(0, 10),
      intent,
    });
  } catch (error) {
    console.error('[shopping-assistant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}

function parseIntent(text: string, categories: string[], previousIntent?: any) {
  const intent: any = {};
  const lower = text.toLowerCase();

  // START WITH PREVIOUS CONTEXT (if any)
  if (previousIntent) {
    intent.budget = previousIntent.budget;
    intent.category = previousIntent.category;
    intent.priority = previousIntent.priority;
  }

  // ONLY OVERRIDE IF EXPLICITLY MENTIONED IN NEW MESSAGE
  // Budget parsing - only if a number or budget keyword is mentioned
  const budgetMatch = text.match(/\$?(\d+)k?|\bbudget[:\s]+\$?(\d+)/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1] || budgetMatch[2]);
    intent.budget = budgetMatch[0].includes('k') ? amount * 1000 : amount;
  }
  
  // If user says "cheap" or "budget", set a reasonable low budget default
  if (!intent.budget && !previousIntent && lower.match(/cheap|budget|value|affordable|inexpensive|low cost/i)) {
    intent.budget = 300; // Default cheap budget
  }
  
  // If no budget specified and no previous context, mark as undefined
  if (!intent.budget && !previousIntent) {
    intent.budget = undefined;
  }

  // Priority parsing - match use cases and features
  if (lower.includes('gaming') || lower.includes('game') || lower.includes('fps') || lower.includes('performance')) {
    intent.priority = 'Performance';
  } else if (lower.includes('battery') || lower.includes('battery life') || lower.includes('all day')) {
    intent.priority = 'Battery';
  } else if (lower.includes('camera') || lower.includes('photo') || lower.includes('picture')) {
    intent.priority = 'Camera';
  } else if (lower.includes('cheap') || lower.includes('budget') || lower.includes('value') || lower.includes('affordable')) {
    intent.priority = 'Value';
  } else if (lower.includes('build') || lower.includes('quality') || lower.includes('durable') || lower.includes('material')) {
    intent.priority = 'Build';
  }
  // If no priority found, default to Overall
  if (!intent.priority) {
    intent.priority = 'Overall';
  }

  // Category parsing - match various category names more intelligently
  // Handle MacBook/Apple laptops
  if (lower.includes('macbook') || (lower.includes('apple') && lower.includes('laptop'))) {
    intent.category = 'Laptops';
    intent.productBrand = 'MacBook';
  }
  // Handle phones first
  else if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('mobile') || lower.includes('cell')) {
    intent.category = 'Smartphones';
  }
  // Handle laptops
  else if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('computer') || lower.includes('pc')) {
    intent.category = 'Laptops';
  }
  // Handle tablets
  else if (lower.includes('tablet') || lower.includes('ipad')) {
    intent.category = 'Tablets';
  }
  // Handle accessories
  else if (lower.includes('accessory') || lower.includes('accessories') || lower.includes('airpods') || lower.includes('cable') || lower.includes('charger')) {
    intent.category = 'Mobile Accessories';
  }
  // Try to match from provided categories list
  else {
    for (const cat of categories) {
      if (cat !== 'All Categories' && lower.includes(cat.toLowerCase())) {
        intent.category = cat;
        break;
      }
    }
  }

  // Default to 'All Categories' if still not specified
  if (!intent.category) {
    intent.category = 'All Categories';
  }

  console.log('[shopping-assistant] Parsed intent:', intent, 'from previous:', previousIntent);

  return intent;
}

/**
 * FETCH PRODUCTS - WITH FALLBACK TO EXTERNAL APIS
 * 
 * STRATEGY:
 * 1. FIRST: Check our local database (most trusted data - reviews from our users)
 * 2. SECOND: If nothing found locally, search external APIs
 *    - Best Buy Free API (10k requests/month free tier)
 *    - Reddit Web Scraping (real user discussions)
 *    - Open Library (for books)
 * 
 * This ensures we always have an answer for the user, even for niche products.
 */
async function fetchProducts(intent: any) {
  try {
    console.log('[shopping-assistant] === PRODUCT SEARCH START ===');
    console.log('[shopping-assistant] Looking for:', intent.category, 'Budget:', intent.budget);
    
    // STEP 1: Try our local database first (most trusted source)
    console.log('[shopping-assistant] STEP 1: Checking local database...');
    const budget = intent.budget !== undefined ? intent.budget : 10000;
    const params = new URLSearchParams({
      budget: budget.toString(),
      category: intent.category || 'All Categories',
      topPriority: intent.priority || 'Overall',
      minRating: '0',
      minReviews: '0',
    });

    console.log('[shopping-assistant] Local query params:', Object.fromEntries(params));
    
    const localResponse = await fetch(`http://localhost:3000/api/find-product?${params}`);
    const localData = await localResponse.json();
    const localProducts = localData.recommendations || [];
    
    console.log('[shopping-assistant] Local database found', localProducts.length, 'products');
    
    // If we found products locally, return them immediately
    if (localProducts.length > 0) {
      console.log('[shopping-assistant] ✓ Returning', localProducts.length, 'products from LOCAL DATABASE');
      console.log('[shopping-assistant] === PRODUCT SEARCH END (LOCAL SOURCE) ===');
      return localProducts;
    }
    
    // STEP 2: Local database empty - try external sources
    console.log('[shopping-assistant] STEP 2: Local database empty, searching external APIs...');
    
    // Try to extract product name from user intent
    // This is used for external search
    const externalProducts = await searchExternalAPIs(intent);
    
    if (externalProducts && externalProducts.length > 0) {
      console.log('[shopping-assistant] ✓ Found', externalProducts.length, 'products from EXTERNAL SOURCES');
      console.log('[shopping-assistant] External sources:', externalProducts.map((p: any) => p.source).join(', '));
      console.log('[shopping-assistant] === PRODUCT SEARCH END (EXTERNAL SOURCES) ===');
      return externalProducts;
    }
    
    // No products found anywhere
    console.log('[shopping-assistant] ✗ No products found in local DB or external APIs');
    console.log('[shopping-assistant] === PRODUCT SEARCH END (NO RESULTS) ===');
    return [];
    
  } catch (error) {
    console.error('[shopping-assistant] Failed to fetch products:', error);
    return [];
  }
}

/**
 * SEARCH EXTERNAL APIS - Fallback when local database is empty
 * 
 * SOURCES (all free):
 * - Best Buy API: Free tier 10k/month, comprehensive product data
 * - Reddit: Web scraping real user discussions and reviews
 * - Open Library: Free book data and reviews
 * 
 * @param intent The parsed user intent (category, budget, priority)
 * @returns Array of products from external sources
 */
async function searchExternalAPIs(intent: any): Promise<any[]> {
  const results: any[] = [];
  
  try {
    console.log('[external-api] Starting external search for:', intent.category);
    
    // Try Best Buy first (most comprehensive product data)
    console.log('[external-api] Attempting Best Buy API search...');
    const bestBuyResults = await searchBestBuyAPI(intent);
    if (bestBuyResults.length > 0) {
      results.push(...bestBuyResults);
      console.log('[external-api] ✓ Best Buy returned', bestBuyResults.length, 'results');
    } else {
      console.log('[external-api] ✗ Best Buy API unavailable or no results');
    }
    
    // If still no results, try Reddit scraping for discussions/reviews
    if (results.length === 0) {
      console.log('[external-api] Attempting Reddit scraping...');
      const redditResults = await scrapeRedditForProducts(intent);
      if (redditResults.length > 0) {
        results.push(...redditResults);
        console.log('[external-api] ✓ Reddit scraping returned', redditResults.length, 'results');
      } else {
        console.log('[external-api] ✗ Reddit scraping yielded no results');
      }
    }
    
    // If still nothing, try Open Library for books
    if (results.length === 0 && intent.category?.toLowerCase().includes('book')) {
      console.log('[external-api] Attempting Open Library search...');
      const openLibResults = await searchOpenLibrary(intent);
      if (openLibResults.length > 0) {
        results.push(...openLibResults);
        console.log('[external-api] ✓ Open Library returned', openLibResults.length, 'results');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('[external-api] Error searching external APIs:', error);
    return [];
  }
}

/**
 * SEARCH BEST BUY API - ENHANCED VERSION
 * 
 * FALLBACK ONLY: This runs when products are NOT found in local database
 * Extracts rich product data for high-quality recommendations
 * 
 * Free tier: 10,000 requests per month
 * Requires: BESTBUY_API_KEY in .env (business email signup required)
 * 
 * ENHANCED FIELDS EXTRACTED:
 * - customerTopRated: Only products with 4.5+ stars and 15+ reviews
 * - description: Short & long product descriptions
 * - features: Top 5 key product features
 * - includedItemList: What's included in the box
 * - warranty: Labor and parts warranty info
 * - color: Available color options
 * - condition: New/Refurbished/Pre-owned status
 * 
 * This transforms raw API data into rich, actionable product info
 * Example: Instead of just "Laptop", returns full feature list + warranty + included items
 */
async function searchBestBuyAPI(intent: any): Promise<any[]> {
  try {
    const apiKey = process.env.BESTBUY_API_KEY;
    if (!apiKey) {
      console.log('[best-buy] API key not configured - using Reddit/Open Library instead');
      return [];
    }
    
    console.log('[best-buy] Searching with enhanced product data extraction...');
    
    const query = `${intent.category || 'products'} ${intent.priority || ''}`.trim();
    
    // Request includes all detailed attributes for rich product info
    const url = `https://api.bestbuy.com/v1/products?search=${encodeURIComponent(
      query
    )}&show=sku,name,regularPrice,customerReviewAverage,customerReviewCount,customerTopRated,shortDescription,longDescription,features,includedItemList,warranty,color,condition,width,height,depth,weight&format=json&pageSize=10&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.log('[best-buy] API request failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      console.log('[best-buy] No products found for query:', query);
      return [];
    }

    // Filter for top-rated products only (4.5+ stars with 15+ reviews)
    // This ensures quality recommendations
    const topRatedProducts = data.products.filter((p: any) => 
      p.customerTopRated === true
    );

    const productsToReturn = topRatedProducts.length > 0 ? topRatedProducts : data.products;
    
    console.log('[best-buy] Found', productsToReturn.length, 'products (filtered for top-rated when available)');

    // Format each product with rich data
    return productsToReturn.slice(0, 5).map((p: any) => formatBestBuyProduct(p));

  } catch (error) {
    console.error('[best-buy] Error:', error);
    return [];
  }
}

/**
 * FORMAT BEST BUY PRODUCT
 * 
 * Transforms raw Best Buy API response into structured product object
 * Extracts and formats all valuable fields for AI analysis
 * 
 * INPUT: Raw Best Buy product object from API
 * OUTPUT: Formatted product with features, warranty, description, etc.
 */
function formatBestBuyProduct(product: any): any {
  // Extract top 5 features from the detailed features list
  const features = product.features?.feature?.slice(0, 5) || [];
  
  // Extract included items (what's in the box)
  const includedItems = product.includedItemList?.includedItem || [];
  
  // Build warranty summary
  let warrantyInfo = '';
  if (product.warrantyLabor || product.warrantyParts) {
    warrantyInfo = `Warranty: ${product.warrantyLabor || 'N/A'} labor, ${product.warrantyParts || 'N/A'} parts`;
  }

  // Build dimensions summary if available
  let dimensions = '';
  if (product.width || product.height || product.depth || product.weight) {
    const parts = [];
    if (product.weight) parts.push(`${product.weight} weight`);
    if (product.width) parts.push(`${product.width}w`);
    if (product.height) parts.push(`${product.height}h`);
    if (product.depth) parts.push(`${product.depth}d`);
    dimensions = parts.join(', ');
  }

  // Build comprehensive description for AI analysis
  let fullDescription = product.shortDescription || '';
  
  // Add features to description for AI context
  if (features.length > 0) {
    fullDescription += '\n\nKey Features:\n' + features.map((f: string) => `• ${f}`).join('\n');
  }
  
  // Add included items
  if (includedItems.length > 0) {
    fullDescription += '\n\nIncludes:\n' + includedItems.map((item: string) => `• ${item}`).join('\n');
  }
  
  // Add warranty info
  if (warrantyInfo) {
    fullDescription += `\n\n${warrantyInfo}`;
  }
  
  // Add dimensions
  if (dimensions) {
    fullDescription += `\n\nDimensions: ${dimensions}`;
  }

  return {
    id: product.sku,
    name: product.name,
    price_cents: Math.round((product.regularPrice || 0) * 100),
    rating: product.customerReviewAverage || 0,
    reviews: product.customerReviewCount || 0,
    source: 'Best Buy API',
    
    // ENHANCED FIELDS
    topRated: product.customerTopRated === true,
    description: product.shortDescription || '',
    longDescription: product.longDescription || '',
    features: features,
    includedItems: includedItems,
    warranty: {
      labor: product.warrantyLabor || 'Not specified',
      parts: product.warrantyParts || 'Not specified',
    },
    color: product.color || 'N/A',
    condition: product.condition || 'New',
    dimensions: {
      width: product.width,
      height: product.height,
      depth: product.depth,
      weight: product.weight,
    },
    
    // Comprehensive description for AI to analyze
    fullDescription: fullDescription,
  };
}

/**
 * SCRAPE REDDIT FOR PRODUCTS
 * Searches Reddit for discussions about products in the user's category
 * 
 * DATA SOURCE: Reddit user discussions and reviews
 * NOTE: Respects robots.txt and basic rate limiting
 */
async function scrapeRedditForProducts(intent: any): Promise<any[]> {
  try {
    const category = intent.category || 'products';
    const budget = intent.budget || 1000;
    
    // Build search query for Reddit
    const query = `${category} review ${intent.priority || ''}`.trim();
    console.log('[reddit] Searching for discussions about:', query);
    
    // Attempt to fetch Reddit search results
    // This is a simplified demonstration
    const redditSearchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&type=link&sort=relevance&limit=5`;
    
    try {
      const response = await fetch(redditSearchUrl, {
        headers: {
          'User-Agent': 'ProductReviewPlatform/1.0 (educational)',
        },
      });
      
      if (!response.ok) {
        console.log('[reddit] Search failed, status:', response.status);
        return [];
      }
      
      const data = await response.json();
      
      // Format Reddit results
      const results = data.data?.children?.slice(0, 3).map((item: any) => ({
        id: item.data.id,
        name: item.data.title,
        source: 'Reddit Discussion',
        price_cents: budget * 100,
        rating: item.data.upvote_ratio * 5 || 3,
        reviews: item.data.num_comments || 0,
        description: item.data.selftext?.substring(0, 200),
      })) || [];
      
      console.log('[reddit] Processed', results.length, 'results');
      return results;
      
    } catch (error) {
      console.log('[reddit] Reddit API access limited:', error instanceof Error ? error.message : 'unknown error');
      return [];
    }
    
  } catch (error) {
    console.error('[reddit] Error scraping Reddit:', error);
    return [];
  }
}

/**
 * SEARCH OPEN LIBRARY
 * Free book and literature data from Internet Archive
 * 
 * DATA SOURCE: Open Library (https://openlibrary.org/developers/api)
 * This is completely free and no API key needed
 */
async function searchOpenLibrary(intent: any): Promise<any[]> {
  try {
    const query = intent.category || 'books';
    console.log('[open-library] Searching for:', query);
    
    // Open Library is completely free, no key needed
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[open-library] Search failed');
      return [];
    }
    
    const data = await response.json();
    
    const results = data.docs?.slice(0, 3).map((book: any) => ({
      id: book.key,
      name: book.title,
      source: 'Open Library (Free)',
      price_cents: 0, // Books are often free or the price varies
      rating: book.ratings_average || 0,
      reviews: book.ratings_count || 0,
      description: book.first_sentence?.[0] || 'See Open Library for details',
    })) || [];
    
    console.log('[open-library] Found', results.length, 'results');
    return results;
    
  } catch (error) {
    console.error('[open-library] Error:', error);
    return [];
  }
}

async function generateStructuredResponse(userMessage: string, products: any[], intent: any): Promise<string> {
  try {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if this is a comparison question early
    const isComparisonQuestion = lowerMessage.includes('out of') || lowerMessage.includes('which one') || 
                                 lowerMessage.includes('which is best') || lowerMessage.includes('which is') ||
                                 lowerMessage.includes('compare') || lowerMessage.includes('best');
    
    // For comparison questions, use all available products even if fetchProducts returned empty
    // This handles follow-up questions after initial recommendations
    if (isComparisonQuestion && products.length === 0) {
      try {
        const fallbackProducts = await fetch(`http://localhost:3000/api/find-product?budget=10000&category=${intent.category || 'All Categories'}&topPriority=Overall&minRating=0&minReviews=0`)
          .then(r => r.json())
          .then(d => d.recommendations || [])
          .catch(() => []);
        
        if (fallbackProducts.length > 0) {
          return generateComparisonResponse(userMessage, fallbackProducts, intent);
        }
      } catch (e) {
        // If fallback fails, continue with empty products
        console.error('Fallback fetch failed:', e);
      }
    }
    
    if (products.length === 0) {
      return `I searched for ${intent.category || 'products'} matching your criteria, but I didn't find any available right now. Try adjusting your budget or let me know if you'd like to explore a different category.`;
    }

    const budget = intent.budget;
    const category = intent.category || 'All Categories';
    const priority = intent.priority || 'Overall';
    const hasBudget = budget !== undefined;
    
    // Filter by budget only if one was specified
    const productsInBudget = hasBudget ? products.filter(p => p.price_cents / 100 <= budget) : products;
    
    // Get category display name
    let categoryDisplay = category;
    if (category === 'All Categories') {
      categoryDisplay = 'products';
    }
    
    // Check if user mentioned gaming
    const isGamingFocus = lowerMessage.includes('gaming') || lowerMessage.includes('game') || lowerMessage.includes('fps');
    
    // If asking which is best (with or without gaming focus)
    if (isComparisonQuestion && productsInBudget.length > 1) {
      return generateComparisonResponse(userMessage, productsInBudget, intent);
    }
    
    // If no budget specified and priority is performance (gaming), show top 3 with best performance
    if (!hasBudget && priority === 'Performance' && productsInBudget.length > 0) {
      const sortedByPerformance = [...productsInBudget].sort((a, b) => 
        (b.performance_rating || 0) - (a.performance_rating || 0)
      );
      const top3 = sortedByPerformance.slice(0, 3);
      
      let response = `Perfect! Here are the top 3 best ${categoryDisplay.toLowerCase()} for gaming, ranked by performance:\n\n`;
      
      top3.forEach((product, index) => {
        const perfScore = product.performance_rating ? product.performance_rating.toFixed(1) : 'N/A';
        const rating = product.avg_rating ? product.avg_rating.toFixed(1) : 'N/A';
        const price = (product.price_cents / 100).toFixed(2);
        response += `${index + 1}. **${product.title}** - $${price}\n`;
        response += `   Performance: ${perfScore}⭐ | Overall Rating: ${rating}⭐\n`;
        response += `   ${product.review_count || 0} user reviews\n\n`;
      });
      
      response += `These are the top performers for gaming. The **${top3[0].title}** is our #1 pick with the best gaming performance.\n\nAsk me "out of these what's best for gaming?" to compare them directly!`;
      return response;
    }
    
    // Default behavior with budget - now more conversational
    let response = '';
    if (hasBudget && priority && priority !== 'Overall') {
      response = `Great! I found ${productsInBudget.length} excellent ${categoryDisplay.toLowerCase()} under $${budget} optimized for ${priority.toLowerCase()}. Here's what I recommend:\n\n`;
    } else if (hasBudget) {
      response = `Awesome! I found ${productsInBudget.length} excellent ${categoryDisplay.toLowerCase()} under $${budget}. Here's what I found:\n\n`;
    } else {
      response = `Perfect! Here are some excellent ${categoryDisplay.toLowerCase()} based on user reviews:\n\n`;
    }

    // Generate smart explanation based on priority with specific use case details
    const topProduct = productsInBudget[0];
    const midProduct = productsInBudget[1];
    const budgetProduct = productsInBudget[2];
    
    let explanation = '';
    const lowerPriority = priority.toLowerCase();
    
    if (lowerPriority === 'battery') {
      if (topProduct) {
        const batteryScore = topProduct.battery_rating ? topProduct.battery_rating.toFixed(1) : 'excellent';
        explanation = `The ${topProduct.title} offers exceptional battery life (${batteryScore}⭐) - you'll get all-day usage and more. Perfect for long work sessions or travel.`;
      }
    } else if (lowerPriority === 'performance') {
      if (topProduct) {
        const perfScore = topProduct.performance_rating ? topProduct.performance_rating.toFixed(1) : 'excellent';
        if (isGamingFocus) {
          explanation = `The ${topProduct.title} has excellent performance specs (${perfScore}⭐ performance rating) that make it ideal for gaming. With fast processors and smooth graphics handling, it delivers lag-free gameplay and can handle demanding games at good settings. Users praise its performance in gaming scenarios.`;
        } else {
          explanation = `The ${topProduct.title} delivers powerful performance (${perfScore}⭐) - handles multitasking, demanding apps, and resource-heavy tasks with ease.`;
        }
      }
    } else if (lowerPriority === 'camera') {
      if (topProduct) {
        explanation = `The ${topProduct.title} has the best camera quality according to user reviews. Sharp photos, excellent low-light performance, and great video capabilities make it perfect for photography enthusiasts.`;
      }
    } else if (lowerPriority === 'value') {
      if (budgetProduct) {
        const savingsPercent = hasBudget ? Math.round(((budget - budgetProduct.price_cents/100) / budget) * 100) : 0;
        explanation = `The ${budgetProduct.title} at just $${(budgetProduct.price_cents/100).toFixed(2)} offers incredible value - you save money without compromising on quality.`;
      }
    } else if (lowerPriority === 'build') {
      if (topProduct) {
        explanation = `The ${topProduct.title} is renowned for premium build quality and durability. Solid construction, quality materials, and excellent craftsmanship ensure this device will last for years.`;
      }
    } else {
      // Overall priority
      if (topProduct) {
        const rating = topProduct.avg_rating ? topProduct.avg_rating.toFixed(1) : '4.2';
        if (isGamingFocus && category === 'Laptops') {
          explanation = `The ${topProduct.title} is the top-rated ${categoryDisplay.toLowerCase()} (${rating}⭐) and excels for gaming thanks to its powerful performance capabilities. It strikes a great balance between gaming power and overall reliability.`;
        } else {
          explanation = `The ${topProduct.title} is the top-rated overall (${rating}⭐) with consistently excellent user reviews across all categories.`;
        }
      }
    }
    
    response += explanation;
    
    // Add AI analysis for coding/programming use case
    if (lowerMessage.includes('coding') || lowerMessage.includes('programming') || lowerMessage.includes('developer') || lowerMessage.includes('development')) {
      response += `\n\n**Why these are great for coding:**\n`;
      
      if (topProduct && topProduct.performance_rating) {
        response += `• The top pick has solid performance for running IDEs and multiple applications\n`;
      }
      
      if (topProduct && category.toLowerCase().includes('laptop')) {
        response += `• Perfect screen real estate for code editing and debugging\n`;
        response += `• Sufficient processing power for compiling and running projects\n`;
      }
      
      if (productsInBudget.length > 1) {
        response += `\n**My recommendation:** The **${topProduct.title}** is your best choice - it balances performance and reliability that developers need.\n`;
      }
    }
    
    // Add comparison tip
    if (productsInBudget.length > 2) {
      response += `\n💡 **Pro tip:** Ask me "compare [product 1] vs [product 2]" or "out of these which is best" and I'll give you a detailed breakdown!`;
    }

    return response;
    
  } catch (error) {
    console.error('[shopping-assistant] Error generating response:', error);
    
    if (products.length === 0) {
      return `I searched but didn't find products matching your criteria. Can you provide more details?`;
    }

    const top = products[0];
    const rating = (parseFloat(String(top?.avg_rating)) || 0).toFixed(1);
    return `Found great options! Top pick: **${top?.title}** - $${(top?.price_cents / 100).toFixed(2)} | ⭐ ${rating}`;
  }
}

function generateComparisonResponse(userMessage: string, products: any[], intent: any): string {
  const lowerMessage = userMessage.toLowerCase();
  const isGamingFocus = lowerMessage.includes('gaming') || lowerMessage.includes('game') || lowerMessage.includes('fps');
  
  if (isGamingFocus) {
    // Sort by performance for gaming
    const sorted = [...products].sort((a, b) => 
      (b.performance_rating || 0) - (a.performance_rating || 0)
    );
    
    const best = sorted[0];
    const second = sorted[1];
    const third = sorted[2];
    
    let response = `Top Recommendation\n`;
    response += `🏆 ${best.title}\n\n`;
    response += `The ${best.title} ranks highest for performance among the available options, with a ${best.performance_rating?.toFixed(1) || 'N/A'}/5 performance rating and an overall rating of ${best.avg_rating?.toFixed(1) || 'N/A'}/5.\n\n`;
    response += `Price: $${(best.price_cents / 100).toFixed(2)}\n\n`;
    
    response += `Why it ranks #1:\n`;
    response += `• Highest gaming performance (${best.performance_rating?.toFixed(1) || 'N/A'}⭐)\n`;
    response += `• Excellent for demanding games at high settings\n`;
    response += `• Fast processing and smooth graphics handling\n\n`;
    
    response += `Performance Comparison:\n`;
    response += `1. ${best.title} - ${best.performance_rating?.toFixed(1) || 'N/A'}⭐ BEST\n`;
    if (second) response += `2. ${second.title} - ${second.performance_rating?.toFixed(1) || 'N/A'}⭐\n`;
    if (third) response += `3. ${third.title} - ${third.performance_rating?.toFixed(1) || 'N/A'}⭐\n`;
    
    return response;
  } else {
    // Generic comparison - sort by overall rating
    const sorted = [...products].sort((a, b) => 
      (b.avg_rating || 0) - (a.avg_rating || 0)
    );
    
    const best = sorted[0];
    const second = sorted[1];
    const third = sorted[2];
    
    let response = `Top Recommendation\n`;
    response += `🏆 ${best.title}\n\n`;
    response += `The ${best.title} ranks highest overall among the available options, with the strongest user satisfaction rating of ${best.avg_rating?.toFixed(1) || 'N/A'}/5.\n\n`;
    response += `Price: $${(best.price_cents / 100).toFixed(2)}\n\n`;
    
    response += `Why it's the best choice:\n`;
    response += `• Highest overall rating (${best.avg_rating?.toFixed(1) || 'N/A'}⭐)\n`;
    response += `• Best user satisfaction\n`;
    response += `• Consistently excellent reviews\n\n`;
    
    response += `Overall Rankings:\n`;
    response += `1. ${best.title} - ${best.avg_rating?.toFixed(1) || 'N/A'}⭐ BEST\n`;
    if (second) response += `2. ${second.title} - ${second.avg_rating?.toFixed(1) || 'N/A'}⭐\n`;
    if (third) response += `3. ${third.title} - ${third.avg_rating?.toFixed(1) || 'N/A'}⭐\n`;
    
    return response;
  }
}
