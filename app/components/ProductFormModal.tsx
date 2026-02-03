'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import ListProductForm from './ListProductForm';

export default function ProductFormModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Reusable handler for add product click
  const handleAddProductClick = () => {
    const addProductPage = '/products/new';
    
    if (!user) {
      // Not authenticated: redirect to auth with callback
      router.push(`/auth?redirect=${encodeURIComponent(addProductPage)}`);
    } else {
      // Authenticated: navigate to add product page
      router.push(addProductPage);
    }
  };

  return (
    <>
      {/* Always visible primary CTA button */}
      {!loading && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 40,
          }}
        >
          <button
            onClick={handleAddProductClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
          >
            <span>➕</span>
            Add a Product
          </button>
        </div>
      )}
    </>
  );
}
