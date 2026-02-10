'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getClientId } from '@/lib/clientId';
import { useAuth } from './AuthProvider';

type ReviewFormProps = {
  productId: string;
  productTitle: string;
  onReviewSubmitted: (newReview: any) => void;
};

const ATTRIBUTES = [
  { key: 'battery', label: 'Battery Life' },
  { key: 'durability', label: 'Durability' },
  { key: 'display', label: 'Display/Screen' },
  { key: 'performance', label: 'Performance/Speed' },
  { key: 'camera', label: 'Camera Quality' },
  { key: 'value', label: 'Value for Money' },
  { key: 'design', label: 'Design/Build' },
];

export default function ReviewForm({ productId, productTitle, onReviewSubmitted }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [overallRating, setOverallRating] = useState(5);
  const [attributes, setAttributes] = useState({
    battery: 5,
    durability: 5,
    display: 5,
    performance: 5,
    camera: 5,
    value: 5,
    design: 5,
  });
  const [notes, setNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [source, setSource] = useState('Website');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleAttributeChange = (attribute: string, rating: number) => {
    setAttributes(prev => ({
      ...prev,
      [attribute]: rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (!reviewerName.trim()) {
        throw new Error('Please enter your name');
      }

      const clientId = getClientId();

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productTitle,
          overallRating,
          attributes,
          notes: notes.trim(),
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail.trim(),
          source,
          wouldRecommend,
          authorClientId: clientId,
          userId: clientId, // Use clientId as userId for demo purposes
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const data = await response.json();
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setReviewerName('');
        setReviewerEmail('');
        setNotes('');
        setOverallRating(5);
        setWouldRecommend(true);
        setAttributes({
          battery: 5,
          durability: 5,
          display: 5,
          performance: 5,
          camera: 5,
          value: 5,
          design: 5,
        });
        // Pass the new review back to parent component
        onReviewSubmitted(data.review);
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setReviewerName('');
    setReviewerEmail('');
    setNotes('');
    setOverallRating(5);
    setWouldRecommend(true);
    setAttributes({
      battery: 5,
      durability: 5,
      display: 5,
      performance: 5,
      camera: 5,
      value: 5,
      design: 5,
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return (
    <div>
      {/* Always show button */}
      {!loading && (
        <button
          onClick={() => {
            if (!user) {
              // If not signed in, redirect to auth page with current page as redirect
              router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
            } else {
              // If signed in, open the form
              setIsOpen(true);
            }
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1f2937",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Write a Review
        </button>
      )}

      {isOpen && user && (
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
            if (e.target === e.currentTarget && !submitting) {
              handleCancel();
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
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
              Share Your Experience
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              {productTitle}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>
                  Overall Rating
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setOverallRating(rating)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: rating <= overallRating ? '#fbbf24' : '#e5e7eb',
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1f2937' }}>
                  Rate These Aspects
                </label>
                {ATTRIBUTES.map(({ key, label }) => (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#4b5563' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#fbbf24' }}>
                        {attributes[key as keyof typeof attributes]} ★
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleAttributeChange(key, rating)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: rating <= (attributes[key as keyof typeof attributes] || 0) ? '#fbbf24' : '#f3f4f6',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: rating <= (attributes[key as keyof typeof attributes] || 0) ? 1 : 0.6,
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any additional thoughts..."
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                  Where did you purchase this?
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option>Website</option>
                  <option>Amazon</option>
                  <option>Best Buy</option>
                  <option>Newegg</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#1f2937', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wouldRecommend}
                    onChange={(e) => setWouldRecommend(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>I would recommend this product to others</span>
                </label>
              </div>

              {submitError && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  Thank you! Your review has been submitted.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
