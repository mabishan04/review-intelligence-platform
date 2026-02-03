'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  products?: any[];
  quickActions?: { label: string; action: 'cheaper' | 'better_battery' | 'compare' }[];
}

interface ParsedIntent {
  budget?: number;
  priority?: string;
  category?: string;
  useCase?: string;
  minRating?: number;
  minReviews?: number;
}

export default function ShoppingAssistantChat({
  onPreferencesChange,
  onGetRecommendations,
  currentPrefs,
  categories,
}: {
  onPreferencesChange: (prefs: any) => void;
  onGetRecommendations: (prefs: any) => Promise<any>;
  currentPrefs: any;
  categories: string[];
}) {
  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : ['All Categories'];
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'assistant',
      content:
        "Hi! I'm your shopping assistant. Tell me your budget and what matters most to you (battery, performance, price, etc.) and I'll recommend the perfect products.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; intent?: any }>>([]);
  const [currentIntent, setCurrentIntent] = useState<ParsedIntent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseIntent = (text: string): ParsedIntent => {
    const intent: ParsedIntent = {};
    const lower = text.toLowerCase();

    // Budget parsing
    const budgetMatch = text.match(/\$?(\d+)/);
    if (budgetMatch) {
      intent.budget = parseInt(budgetMatch[1]);
    } else if (lower.includes('cheap') || lower.includes('budget')) {
      intent.budget = Math.max(100, currentPrefs.budget * 0.7);
    } else if (lower.includes('expensive') || lower.includes('premium') || lower.includes('high-end')) {
      intent.budget = currentPrefs.budget * 1.5;
    }

    // Priority parsing
    const priorities = ['battery', 'performance', 'camera', 'value', 'build', 'overall'];
    for (const p of priorities) {
      if (lower.includes(p)) {
        intent.priority = p.charAt(0).toUpperCase() + p.slice(1);
        break;
      }
    }

    // Use case parsing
    const useCases = ['everyday', 'work', 'school', 'gaming', 'content', 'business', 'travel'];
    for (const uc of useCases) {
      if (lower.includes(uc)) {
        intent.useCase = uc.charAt(0).toUpperCase() + uc.slice(1);
        break;
      }
    }

    // Category parsing
    for (const cat of categories) {
      if (lower.includes(cat.toLowerCase())) {
        intent.category = cat;
        break;
      }
    }

    // Rating parsing
    const ratingMatch = text.match(/(\d\.?\d?)\s*(?:stars?|out of|\+)/i);
    if (ratingMatch) {
      intent.minRating = Math.floor(parseFloat(ratingMatch[1]));
    }

    // Reviews parsing
    if (lower.includes('popular') || lower.includes('well-reviewed') || lower.includes('10+') || lower.includes('lots of reviews')) {
      intent.minReviews = 10;
    }

    return intent;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Parse intent early
    const parsedIntent = parseIntent(userMessage);
    setCurrentIntent(parsedIntent);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Show loading message
    setLoading(true);
    const loadingMsg: Message = {
      id: 'loading',
      type: 'assistant',
      content: 'Finding the best matches…',
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      // Call the AI shopping assistant API with conversation history
      const response = await fetch('/api/shopping-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          categories: safeCategories,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Remove loading message
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      // Add AI response message with products
      const assistantMsg: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: typeof data.message === 'string' ? data.message : 'I found some products for you.',
        products: Array.isArray(data.products) ? data.products : [],
        quickActions: [
          { label: '🔋 Better battery', action: 'better_battery' },
          { label: '💸 Cheaper', action: 'cheaper' },
          { label: '⚖️ Compare top 2', action: 'compare' },
        ],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation history with actual resolved intent
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { 
          role: 'assistant', 
          content: typeof data.message === 'string' ? data.message : 'I found some products for you.',
          intent: data.intent || {} 
        },
      ]);

      // Store the intent for context header
      if (data.intent) {
        setCurrentIntent(data.intent);
        const updatedPrefs = {
          budget: data.intent.budget ?? currentPrefs.budget,
          topPriority: data.intent.priority ?? currentPrefs.topPriority,
          category: data.intent.category ?? currentPrefs.category,
          useCase: currentPrefs.useCase,
          minRating: currentPrefs.minRating,
          minReviews: currentPrefs.minReviews,
        };
        onPreferencesChange(updatedPrefs);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));
      const errorMsg: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: typeof error === 'string' ? error : 'Sorry, I had trouble understanding that. Could you rephrase what you\'re looking for?',
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error('[chat] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: 'cheaper' | 'better_battery' | 'compare') => {
    if (action === 'cheaper') {
      const newBudget = Math.max(100, currentPrefs.budget * 0.8);
      setInput(`Show me options under $${Math.round(newBudget)}`);
    } else if (action === 'better_battery') {
      setInput('What has the best battery life?');
    } else if (action === 'compare') {
      setInput('Compare the top 2 results');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: 'transparent',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            {/* Context header for assistant messages with results */}
            {msg.type === 'assistant' && currentIntent && msg.products && msg.products.length > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#0891b2',
                  marginBottom: '8px',
                  paddingLeft: '4px',
                  fontWeight: 600,
                }}
              >
                Results for: 
                {currentIntent.category && ` ${currentIntent.category} ·`}
                {currentIntent.budget && ` Budget ≤ $${currentIntent.budget} ·`}
                {currentIntent.priority && ` Priority: ${currentIntent.priority}`}
              </div>
            )}

            {/* Message bubble */}
            <div
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: msg.type === 'user' ? '70%' : '90%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: msg.type === 'user' 
                    ? '#0891b2'
                    : '#f3f4f6',
                  color: msg.type === 'user' ? 'white' : '#1f2937',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  border: 'none',
                }}
              >
                {msg.content}
              </div>
            </div>

            {/* Separator before products */}
            {msg.products && msg.products.length > 0 && (
              <div style={{ height: '1px', backgroundColor: '#d1d5db', margin: '8px 0' }} />
            )}

            {/* Product results - compact for chat */}
            {msg.products && msg.products.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {msg.products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                    }}
                  >
                    {/* Product image - smaller */}
                    <div
                      style={{
                        width: '100%',
                        height: '120px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: '12px',
                      }}
                    >
                      No image
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.title}
                    </div>

                    {/* Price + Rating on one line */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: '#06b6d4', fontWeight: '700', fontSize: '16px' }}>
                        ${(product.price_cents / 100).toFixed(2)}
                      </span>
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                        ⭐ {(parseFloat(String(product.avg_rating)) || 0).toFixed(1)}
                      </span>
                    </div>

                    {/* Trust cue */}
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#0891b2',
                        marginBottom: '8px',
                        fontWeight: 500,
                      }}
                    >
                      Based on {product.review_count} reviews
                    </div>

                    {/* 2 pros, 1 con */}
                    <div style={{ fontSize: '12px', color: '#059669', marginBottom: '6px' }}>
                      <div>✓ Highly rated</div>
                      {product.battery_rating && product.battery_rating >= 4.0 && (
                        <div>✓ Great battery</div>
                      )}
                    </div>

                    {product.review_count && product.review_count < 3 && (
                      <div style={{ fontSize: '12px', color: '#dc2626' }}>
                        ⚠ Limited reviews
                      </div>
                    )}

                    {/* View button */}
                    <button
                      onClick={() => {
                        window.location.href = `/products/${product.id}`;
                      }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '8px 12px',
                        backgroundColor: '#0891b2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0e7490';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0891b2';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      }}
                    >
                      View Product
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up chips */}
            {msg.quickActions && msg.type === 'assistant' && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '12px',
                }}
              >
                {msg.quickActions.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => handleQuickAction(action.action)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db';
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleSendMessage();
            }
          }}
          placeholder="Ask me anything... (e.g., '$500 budget, good battery)"
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '15px',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = '#0891b2';
            (e.target as HTMLInputElement).style.outline = 'none';
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = '#d1d5db';
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: loading || !input.trim() ? '#e5e7eb' : '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0e7490';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && input.trim()) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0891b2';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
