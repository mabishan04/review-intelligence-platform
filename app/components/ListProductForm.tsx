'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type DuplicateInfo = {
  duplicate: boolean;
  product?: {
    id: string;
    title: string;
    brand: string | null;
    category: string;
  };
  similarity?: number;
};

interface ListProductFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Smartphones',
  'Laptops',
  'Tablets',
  'Headphones',
  'Monitors',
  'Cameras',
  'TVs',
  'Audio Systems',
  'Gaming Consoles',
  'Wearables',
  'Smart Home',
  'Accessories',
  'Other',
];

export default function ListProductForm({ onSuccess }: ListProductFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [checking, setChecking] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Validation helpers
  const titleValid = title.trim().length > 2;
  const categoryValid = category.length > 0;
  // Price is valid if at least one of min or max is provided (or both are empty for "price varies")
  const priceValid = true; // Both prices are optional

  // Real-time duplicate check
  useEffect(() => {
    if (!title.trim()) {
      setDuplicateInfo(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setChecking(true);
        setError(null);

        const params = new URLSearchParams({
          title,
        });
        if (brand.trim()) params.append('brand', brand);
        if (category.trim()) params.append('category', category);

        const res = await fetch(
          `/api/products/check-duplicate?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error('Failed to check duplicate');

        const data = await res.json();
        setDuplicateInfo(data);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error(err);
          setError('Could not check for duplicates.');
        }
      } finally {
        setChecking(false);
      }
    }, 400); // debounce

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [title, brand, category]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          brand,
          category,
          priceMin: priceMin.trim() ? Number(priceMin) : null,
          priceMax: priceMax.trim() ? Number(priceMax) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      if (data.duplicate && data.productId) {
        // Redirect to existing product
        router.push(`/products/${data.productId}`);
        return;
      }

      if (data.success && data.productId) {
        router.push(`/products/${data.productId}`);
        onSuccess?.();
        return;
      }

      throw new Error('Unexpected response from server');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isDuplicate = duplicateInfo?.duplicate;
  const similarity = duplicateInfo?.similarity ?? 0;
  
  // Only hard-block on exact duplicates (>= 0.98 similarity)
  // For similar products, just warn but allow submission
  const isExactDuplicate = isDuplicate && similarity >= 0.98;

  const canSubmit =
    titleValid && categoryValid && priceValid && !isExactDuplicate && !submitting;

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: 24,
        backgroundColor: '#f9fafb',
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        List a Product
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
        Add a product to the catalog so users can review it.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#b91c1c',
            padding: 10,
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>✗ {error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
            Product Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MacBook Pro 14-inch"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: titleValid ? '1px solid #d1d5db' : '1px solid #dc2626',
              fontSize: 14,
              backgroundColor: titleValid ? 'white' : '#fef2f2',
            }}
          />
          {title.trim().length > 0 && !titleValid && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              ✗ Title must be at least 3 characters
            </div>
          )}
          {titleValid && (
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
              ✓ Looks good
            </div>
          )}
        </div>

        {/* Brand & Category Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Brand Input */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
              Brand
            </label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Apple"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
              }}
            />
          </div>

          {/* Category Select */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: categoryValid ? '1px solid #d1d5db' : '1px solid #dc2626',
                fontSize: 14,
                backgroundColor: categoryValid ? 'white' : '#fef2f2',
                cursor: 'pointer',
              }}
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {category.length === 0 && category !== '' && (
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                ✗ Please select a category
              </div>
            )}
          </div>
        </div>

        {/* Price Range Input */}
        <div>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
            Price Range (USD)
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
            Prices vary by location and retailer. Enter a range or leave blank if unknown.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Min Price Input */}
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#6b7280' }}>
                Min Price
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '10px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  $
                </span>
                <input
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="1299"
                  type="number"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 28px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            {/* Max Price Input */}
            <div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#6b7280' }}>
                Max Price
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '10px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#6b7280',
                  }}
                >
                  $
                </span>
                <input
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="1499"
                  type="number"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 28px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
          </div>
          {priceMin && priceMax && Number(priceMin) > Number(priceMax) && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>
              ⚠️ Min price should be less than max price
            </div>
          )}
        </div>

        {/* Duplicate Detection - Enhanced UI */}
        {title.trim().length > 2 && (
          <div style={{ marginTop: 8 }}>
            {checking && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                ⏳ Checking for similar products…
              </div>
            )}
            {!checking && isDuplicate && duplicateInfo?.product && (
              <div
                style={{
                  backgroundColor: isExactDuplicate ? '#fef2f2' : '#fef3c7',
                  border: isExactDuplicate ? '1px solid #fee2e2' : '1px solid #fcd34d',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isExactDuplicate ? '#b91c1c' : '#92400e',
                    marginBottom: 8,
                  }}
                >
                  {isExactDuplicate ? '⛔ Exact match found' : '🔶 Similar product found'}
                </div>
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 10,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {duplicateInfo.product.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    {duplicateInfo.product.brand && `${duplicateInfo.product.brand} • `}
                    {duplicateInfo.product.category}
                  </div>
                  <div style={{ fontSize: 12, color: '#859900' }}>
                    {Math.round(similarity * 100)}% match
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/products/${duplicateInfo.product!.id}`)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: isExactDuplicate ? '#fee2e2' : '#fff3cd',
                      color: isExactDuplicate ? '#991b1b' : '#856404',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      marginBottom: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isExactDuplicate
                        ? '#fecaca'
                        : '#ffeaa7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isExactDuplicate
                        ? '#fee2e2'
                        : '#fff3cd';
                    }}
                  >
                    👉 Go to this product
                  </button>
                </div>

                {!isExactDuplicate && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#92400e',
                      backgroundColor: '#fffbeb',
                      padding: 8,
                      borderRadius: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    💡 <strong>If this is a newer model</strong> (e.g., iPhone 16 vs 15), you can
                    safely list it. The system shows similar products to help users find what they're
                    looking for.
                  </div>
                )}

                {isExactDuplicate && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#991b1b',
                      backgroundColor: '#fef2f2',
                      padding: 8,
                      borderRadius: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    ⛔ <strong>This product already exists</strong> in the catalog. Please use the
                    link above to add a review instead.
                  </div>
                )}
              </div>
            )}
            {!checking && duplicateInfo && !isDuplicate && (
              <div
                style={{
                  fontSize: 13,
                  color: '#15803d',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                ✓ Product looks unique – ready to list
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '12px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: canSubmit ? '#111827' : '#d1d5db',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
          >
            {submitting ? 'Listing…' : 'List Product'}
          </button>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10, textAlign: 'center' }}>
            After listing, users can immediately start reviewing this product.
          </p>
        </div>
      </form>
    </div>
  );
}
