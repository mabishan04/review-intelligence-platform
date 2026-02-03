'use client';

import { useAuth } from './AuthProvider';

export default function HomeProductFormSection() {
  const { user, loading } = useAuth();

  // This section is no longer used - users should use the dedicated /products/new page
  // accessed via the black ➕ button in the top right
  return null;
}
