import { Suspense } from 'react';
import AuthPageClient from './AuthPageClient';

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center', color: '#475569' }}>
        <p>Loading…</p>
      </div>
    </div>}>
      <AuthPageClient />
    </Suspense>
  );
}

