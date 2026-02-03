'use client';

import { useState, useEffect } from 'react';
import { getClientId } from '@/lib/clientId';
import ReviewForm from './ReviewForm';

type Review = {
  id: string;
  overallRating?: number;
  rating?: number | null;
  review_text?: string;
  source?: string | null;
  attributes?: {
    battery?: number;
    durability?: number;
    display?: number;
    performance?: number;
    camera?: number;
    value?: number;
    design?: number;
  };
  notes?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  created_at: string;
  wouldRecommend?: boolean;
  authorClientId?: string;
};

type InsightData = {
  summary: string;
  pros: string[];
  cons: string[];
  recommendation: string;
};

export default function ProductDetailClient({
  productId,
  reviews: initialReviews,
  productTitle,
}: {
  productId: string;
  reviews: Review[];
  productTitle: string;
}) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editAttributes, setEditAttributes] = useState({
    battery: 0,
    durability: 0,
    display: 0,
    performance: 0,
    camera: 0,
    value: 0,
    design: 0,
  });
  const [editNotes, setEditNotes] = useState('');
  const [editRecommend, setEditRecommend] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Initialize clientId on client-side only to avoid hydration mismatch
  useEffect(() => {
    setClientId(getClientId());
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Separate reviews with real text vs only stars
      const textReviews = reviews.filter((r) =>
        (r.review_text || r.notes)?.toString().trim().length
      );

      // If we have at least one text review → use AI
      if (textReviews.length > 0) {
        const reviewTexts = textReviews
          .map((r) => (r.review_text || r.notes || "").toString())
          .filter(Boolean);

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || r.overallRating || 0), 0) /
              reviews.length
            : 0;

        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            productTitle,
            reviews: reviewTexts,
            avgRating,
            reviewCount: reviews.length,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate insights");
        }

        const data = await response.json();
        setInsights(data);
        return;
      }

      // 2) No text reviews at all → fallback based only on ratings / attributes
      if (reviews.length === 0) {
        setError("This product needs at least one review to generate insights.");
        return;
      }

      // Use a helper that builds a summary from stars only
      const fallback = generateInsightsFromRatingsOnly(reviews, productTitle);
      setInsights(fallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // As a final fallback, still try to generate something from ratings only
      if (reviews.length > 0) {
        const fallback = generateInsightsFromRatingsOnly(reviews, productTitle);
        setInsights(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.overallRating ?? 0);
    setEditAttributes({
      battery: review.attributes?.battery ?? 0,
      durability: review.attributes?.durability ?? 0,
      display: review.attributes?.display ?? 0,
      performance: review.attributes?.performance ?? 0,
      camera: review.attributes?.camera ?? 0,
      value: review.attributes?.value ?? 0,
      design: review.attributes?.design ?? 0,
    });
    setEditNotes(review.notes ?? '');
    setEditRecommend(review.wouldRecommend ?? false);
  };

  const handleSaveEdit = async (reviewId: string) => {
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating: editRating,
          attributes: editAttributes,
          notes: editNotes.trim(),
          wouldRecommend: editRecommend,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        alert(`Failed to update review: ${errorData.error || 'Unknown error'}`);
        setEditSubmitting(false);
        return;
      }

      const data = await res.json();
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? data.review : r))
      );
      setEditingReviewId(null);
      setEditSubmitting(false);
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Error updating review: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setEditSubmitting(false);
    }
  };

  const generateMockInsights = (reviews: Review[]): InsightData => {
    // Extract pros and cons from reviews
    const pros: string[] = [];
    const cons: string[] = [];

    reviews.forEach(review => {
      const text = (review.review_text || review.notes || '').toLowerCase();
      const rating = review.overallRating || review.rating;
      
      if (rating && rating >= 4) {
        // Extract likely pros from positive reviews
        if (text.includes('performance')) pros.push('Excellent performance');
        if (text.includes('camera')) pros.push('Great camera quality');
        if (text.includes('battery')) pros.push('Long battery life');
        if (text.includes('display')) pros.push('Great display');
        if (text.includes('fast') || text.includes('speed')) pros.push('Fast processing');
      } else if (rating && rating <= 3) {
        // Extract likely cons from negative reviews
        if (text.includes('plastic') || text.includes('cheap')) cons.push('Plastic build feels cheap');
        if (text.includes('battery')) cons.push('Battery could be better');
        if (text.includes('slow')) cons.push('Not the fastest');
        if (text.includes('price') || text.includes('expensive')) cons.push('Pricey');
      }
    });

    // Remove duplicates and limit to 3
    const uniquePros = Array.from(new Set(pros)).slice(0, 3);
    const uniqueCons = Array.from(new Set(cons)).slice(0, 3);

    // Default if not enough found
    if (uniquePros.length === 0) {
      uniquePros.push('Good overall quality');
    }
    if (uniqueCons.length === 0) {
      uniqueCons.push('Minor improvements needed');
    }

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    return {
      summary: `The ${productTitle} received overwhelmingly positive reviews for its ${uniquePros[0]?.toLowerCase() || 'quality'}. Users appreciated the product's performance and features. However, some reviewers noted that ${uniqueCons[0]?.toLowerCase() || 'there are areas for improvement'}.`,
      pros: uniquePros,
      cons: uniqueCons,
      recommendation: avgRating >= 4 ? `${Math.round((reviews.filter(r => r.rating && r.rating >= 4).length / reviews.length) * 100)}% would recommend` : 'Mixed feedback',
    };
  };

  const generateInsightsFromRatingsOnly = (
    reviews: Review[],
    productTitle: string
  ): InsightData => {
    const count = reviews.length;

    const overallAvg =
      count > 0
        ? reviews.reduce(
            (sum, r) => sum + (r.overallRating ?? r.rating ?? 0),
            0
          ) / count
        : 0;

    const attrKeys: (keyof NonNullable<Review["attributes"]>)[] = [
      "battery",
      "performance",
      "camera",
      "display",
      "durability",
      "value",
      "design",
    ];

    const attrAverages: Partial<Record<string, number>> = {};

    attrKeys.forEach((key) => {
      let sum = 0;
      let n = 0;
      reviews.forEach((r) => {
        const v = r.attributes?.[key];
        if (typeof v === "number" && v > 0) {
          sum += v;
          n += 1;
        }
      });
      if (n > 0) {
        attrAverages[key] = sum / n;
      }
    });

    const pros: string[] = [];
    const cons: string[] = [];

    // Mark clear strengths / weaknesses
    Object.entries(attrAverages).forEach(([key, value]) => {
      const label = key[0].toUpperCase() + key.slice(1);
      if (value !== undefined) {
        if (value >= 4.3) {
          pros.push(`${label} is rated very highly (${value.toFixed(1)}/5).`);
        } else if (value > 0 && value <= 3.0) {
          cons.push(`${label} could be better (${value.toFixed(1)}/5).`);
        }
      }
    });

    // If no obvious strengths, pick the top 1–2 highest attributes and phrase them softer
    if (pros.length === 0 && Object.keys(attrAverages).length > 0) {
      const sorted = Object.entries(attrAverages).sort((a, b) => b[1]! - a[1]!);
      const top = sorted.slice(0, 2);
      top.forEach(([key, value]) => {
        if (value !== undefined) {
          const label = key[0].toUpperCase() + key.slice(1);
          pros.push(`${label} scores the highest among the rated aspects (${value.toFixed(1)}/5).`);
        }
      });
    }

    // If no clear cons, keep it chill
    if (cons.length === 0) {
      cons.push("No single weak spot stands out from the star ratings alone.");
    }

    // Build a summary that actually matches the average score
    let overallSentence = "";
    if (overallAvg >= 4.2) {
      overallSentence = `Overall satisfaction with the ${productTitle} is very high, with an average rating of ${overallAvg.toFixed(
        1
      )}/5 based on ${count} rating${count === 1 ? "" : "s"}.`;
    } else if (overallAvg >= 3.4) {
      overallSentence = `Ratings for the ${productTitle} are generally positive, averaging ${overallAvg.toFixed(
        1
      )}/5 from ${count} rating${count === 1 ? "" : "s"}.`;
    } else if (overallAvg >= 2.6) {
      overallSentence = `Ratings for the ${productTitle} are mixed, with an average of ${overallAvg.toFixed(
        1
      )}/5 across ${count} rating${count === 1 ? "" : "s"}.`;
    } else {
      overallSentence = `Right now, many reviewers are not fully satisfied with the ${productTitle}: it averages ${overallAvg.toFixed(
        1
      )}/5 from ${count} rating${count === 1 ? "" : "s"}.`;
    }

    const secondSentence =
      "Even without written comments, the pattern in star ratings gives a clear picture of how this product is performing.";

    const summary = `${overallSentence} ${secondSentence}`;

    const recommendPercent =
      count > 0
        ? Math.round(
            (reviews.filter(
              (r) => (r.overallRating ?? r.rating ?? 0) >= 4
            ).length /
              count) *
              100
          )
        : 0;

    let recommendation: string;
    if (recommendPercent >= 70) {
      recommendation = `${recommendPercent}% of reviewers gave this product 4★ or higher — a strong recommendation overall.`;
    } else if (recommendPercent >= 40) {
      recommendation = `${recommendPercent}% of reviewers rated it 4★ or above — worth considering, but check the weaker areas above.`;
    } else {
      recommendation =
        "Ratings are on the low side overall, so buyers should pay close attention to the weaker areas.";
    }

    return {
      summary,
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
      recommendation,
    };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          What Users Say
        </h2>
        {insights && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            padding: '5px 12px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginLeft: 'auto'
          }}>
            AI Summary
          </span>
        )}
      </div>

      {/* Insights Section */}
      {insights ? (
        <div style={{ marginBottom: 48 }}>
          {/* Summary Text */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            padding: 24,
            marginBottom: 28,
            lineHeight: 1.7,
            color: '#1e3a8a',
            fontSize: 15,
            borderLeft: '3px solid #60a5fa'
          }}>
            {insights.summary}
          </div>

          {/* Pros and Cons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            {/* Pros */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #dcfce7',
              borderRadius: 8,
              padding: 24,
              borderLeft: '3px solid #4ade80'
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#166534',
                marginBottom: 18,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Strengths
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.pros.map((pro, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    color: '#166534',
                    fontSize: 14,
                    lineHeight: 1.6
                  }}>
                    <span style={{ color: '#4ade80', fontWeight: 600, marginTop: 2 }}>•</span>
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: 24,
              borderLeft: '3px solid #facc15'
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#78350f',
                marginBottom: 18,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Considerations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.cons.map((con, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    color: '#78350f',
                    fontSize: 14,
                    lineHeight: 1.6
                  }}>
                    <span style={{ color: '#facc15', fontWeight: 600, marginTop: 2 }}>•</span>
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={generateInsights}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              {loading ? 'Regenerating...' : 'Regenerate Insights'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 48 }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px dashed #0ea5e9',
            borderRadius: 12,
            padding: 28,
            textAlign: 'center',
            marginBottom: 32
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
            <div style={{ color: '#0369a1', marginBottom: 20, fontSize: 15 }}>
              Click below to generate an AI-powered summary of what customers are saying about this product
            </div>
            <button
              onClick={generateInsights}
              disabled={loading || reviews.length === 0}
              style={{
                padding: '14px 32px',
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                color: '#ffffff',
                cursor: loading || reviews.length === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || reviews.length === 0 ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => !loading && reviews.length > 0 && (e.currentTarget.style.backgroundColor = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
            >
              {loading ? 'Generating Insights...' : 'Generate AI Insights'}
            </button>
            {reviews.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#0369a1' }}>
                This product needs at least one review to generate insights
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write Review Form - Always Available - At Top */}
      <div style={{ paddingBottom: 32, borderBottom: '1px solid #e5e7eb', marginBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            Share Your Experience
          </h3>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Help others make informed decisions
          </p>
        </div>
        <ReviewForm 
          productId={productId} 
          productTitle={productTitle}
          onReviewSubmitted={(newReview) => {
            // Add new review to the top of the list
            setReviews((prev) => [newReview, ...prev]);
          }}
        />
      </div>

      {/* Reviews List */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
          Recent Reviews
        </h3>

        {/* Recommendation percentage */}
        {reviews.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 14, color: '#047857', fontWeight: 600 }}>
            👍 {Math.round((reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100)}% of reviewers would recommend this product
          </div>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {reviews.map((r) => {
              const rating = r.overallRating ?? r.rating ?? 0;
              const sentiment = rating && rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
              const sentimentEmoji = sentiment === 'positive' ? '😊' : sentiment === 'neutral' ? '😐' : '😞';
              const sentimentColor = sentiment === 'positive' ? '#10b981' : sentiment === 'neutral' ? '#f59e0b' : '#ef4444';
              const attributes = r.attributes || null;
              const hasStructuredData = !!attributes;
              const isMine = clientId && r.authorClientId && r.authorClientId === clientId;
              
              return (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: '#fff',
                    border: `1px solid ${sentimentColor}33`,
                    borderRadius: 12,
                    padding: 24,
                    transition: 'all 0.2s',
                    borderLeft: `4px solid ${sentimentColor}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{sentimentEmoji}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: sentimentColor }}>
                          {rating ? `${rating}/5 Stars` : 'No rating'}
                        </span>
                        {r.wouldRecommend && (
                          <span style={{ fontSize: 12, backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontWeight: 500, marginLeft: 4 }}>
                            Recommends
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 8 }}>
                        {r.reviewerName && (
                          <>
                            <span style={{ fontWeight: 500 }}>
                              {r.reviewerName}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        {r.source && (
                          <>
                            <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                              {r.source}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>{new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 20,
                      color: '#fbbf24',
                      display: 'flex',
                      gap: 2
                    }}>
                      {'★'.repeat(rating || 0)}
                    </div>
                  </div>

                  {hasStructuredData ? (
                    <div>
                      {attributes && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                            Ratings:
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {(
                              [
                                { key: 'battery', label: 'Battery', icon: '🔋' },
                                { key: 'performance', label: 'Performance', icon: '⚡' },
                                { key: 'camera', label: 'Camera', icon: '📷' },
                              ] as const
                            ).map(({ key, label, icon }) => {
                              const score = attributes?.[key] ?? 0;
                              return (
                                <div key={key} style={{ fontSize: 12 }}>
                                  <span style={{ marginRight: 4 }}>{icon}</span>
                                  <span style={{ color: '#4b5563' }}>{label}:</span>
                                  <span
                                    style={{ color: '#fbbf24', fontWeight: 600, marginLeft: 4 }}
                                  >
                                    {'★'.repeat(score)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {r.notes && (
                        <div
                          style={{
                            lineHeight: 1.6,
                            color: '#374151',
                            fontSize: 14,
                            marginBottom: 12,
                          }}
                        >
                          {r.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        lineHeight: 1.7,
                        color: '#374151',
                        fontSize: 15,
                        marginBottom: 12,
                      }}
                    >
                      {`"${r.review_text || r.notes || 'No additional notes'}"`}
                    </div>
                  )}

                  {/* Delete button for own reviews */}
                  {isMine && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEditReview(r)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#0c4a6e',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to delete this review?')) return;
                          try {
                            const res = await fetch(`/api/reviews/${r.id}`, {
                              method: 'DELETE',
                            });
                            if (!res.ok) {
                              const errorData = await res.json().catch(() => ({}));
                              alert(`Failed to delete review: ${errorData.error || 'Unknown error'}`);
                              return;
                            }
                            setReviews((prev) => prev.filter((rev) => rev.id !== r.id));
                          } catch (err) {
                            console.error('Error deleting review:', err);
                            alert('Error deleting review: ' + (err instanceof Error ? err.message : 'Unknown error'));
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#b91c1c',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReviewId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !editSubmitting) {
              setEditingReviewId(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
              Edit Review
            </h2>

            {/* Overall Rating */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>
                Overall Rating
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setEditRating(rating)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: rating <= editRating ? '#fbbf24' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Attributes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1f2937' }}>
                Rate These Aspects
              </label>
              {[
                { key: 'battery', label: 'Battery Life' },
                { key: 'durability', label: 'Durability' },
                { key: 'display', label: 'Display/Screen' },
                { key: 'performance', label: 'Performance/Speed' },
                { key: 'camera', label: 'Camera Quality' },
                { key: 'value', label: 'Value for Money' },
                { key: 'design', label: 'Design/Build' },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#4b5563' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#fbbf24' }}>
                      {editAttributes[key as keyof typeof editAttributes]} ★
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setEditAttributes(prev => ({ ...prev, [key]: rating }))}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: rating <= (editAttributes[key as keyof typeof editAttributes] || 0) ? '#fbbf24' : '#f3f4f6',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          opacity: rating <= (editAttributes[key as keyof typeof editAttributes] || 0) ? 1 : 0.6,
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Update your thoughts..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Recommendation Checkbox */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#1f2937', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editRecommend}
                  onChange={(e) => setEditRecommend(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>I would recommend this product to others</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEditingReviewId(null)}
                disabled={editSubmitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: editSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(editingReviewId)}
                disabled={editSubmitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: editSubmitting ? 'not-allowed' : 'pointer',
                  opacity: editSubmitting ? 0.7 : 1,
                }}
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
