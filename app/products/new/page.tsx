'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import ListProductForm from '@/app/components/ListProductForm';

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleFormSuccess = () => {
    router.push('/products');
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Access Denied
          </h1>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            Please sign in to add a product.
          </p>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Have a product to showcase?
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
          Share it with the community and get real reviews.
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          maxWidth: '600px',
        }}
      >
        <ListProductForm onSuccess={handleFormSuccess} />
      </div>
    </main>
  );
}
