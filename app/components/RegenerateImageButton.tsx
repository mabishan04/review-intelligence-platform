'use client';

import { useState } from 'react';

interface RegenerateImageButtonProps {
  productId: string;
  productTitle: string;
  imageSource?: string;
  onSuccess?: (newImageUrl: string) => void;
}

export default function RegenerateImageButton({
  productId,
  productTitle,
  imageSource,
  onSuccess,
}: RegenerateImageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    const adminToken = prompt('Enter admin token to regenerate image:');
    if (!adminToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}/regenerate-image`, {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to regenerate image');
        return;
      }

      // Force page refresh to show new image
      window.location.reload();
      onSuccess?.(data.imageUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for AI-generated images
  if (imageSource !== 'ai_generated') {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={handleRegenerate}
        disabled={isLoading}
        style={{
          padding: '10px 16px',
          backgroundColor: isLoading ? '#d1d5db' : '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'inline-block',
          width: 'fit-content',
        }}
      >
        {isLoading ? '🔄 Regenerating...' : '🔄 Regenerate Image'}
      </button>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#dc2626',
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
