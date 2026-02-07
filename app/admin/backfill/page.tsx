'use client';

import { useState } from 'react';

export default function AdminBackfillPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackfill = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/process-existing-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to start backfill');
        return;
      }

      setMessage(
        `✅ ${data.message}\n\nProcessing ${data.productsToProcess} products in the background...\n\nCheck the terminal for progress. This may take a few minutes depending on the number of products.`
      );
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '40px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '40px',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>
          Backfill Product Images
        </h1>

        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          This will process all existing products in your catalog:
        </p>

        <ul
          style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '24px',
            paddingLeft: '24px',
          }}
        >
          <li style={{ marginBottom: '8px' }}>
            ✓ Generate AI images for products without images
          </li>
          <li style={{ marginBottom: '8px' }}>
            ✓ Run AI verification on all products
          </li>
          <li style={{ marginBottom: '8px' }}>
            ✓ Update Firestore with results
          </li>
          <li>⏳ Runs in background (may take 5-10 minutes)</li>
        </ul>

        <p
          style={{
            fontSize: '12px',
            color: '#ea580c',
            backgroundColor: '#fed7aa',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          💡 Check your terminal/console for progress updates
        </p>

        <button
          onClick={handleBackfill}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: loading ? '#cbd5e1' : '#0ea5e9',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#0284c7';
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#0ea5e9';
          }}
        >
          {loading ? 'Processing...' : 'Start Backfill'}
        </button>

        {message && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#166534',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
